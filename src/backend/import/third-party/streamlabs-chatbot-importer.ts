import fsp from "fs/promises";
import xlsx from "node-xlsx";
import { DateTime } from "luxon";
import type { HelixUser } from "@twurple/api";

import type { ParsedQuotes, ParsedViewers, ThirdPartyImporter } from "../../../types/import";
import type { Quote } from "../../../types/quotes";
import type { FirebotViewer } from "../../../types/viewers";

import { TwitchApi } from "../../streaming-platforms/twitch/api";
import chatRolesManager from "../../roles/chat-roles-manager";
import viewerDatabase from "../../viewers/viewer-database";
import logger from "../../logwrapper";

interface Settings {
    viewers: {
        includeViewHours: boolean;
        includeZeroHoursViewers: boolean;
    };
}

type StreamlabsViewer = {
    id: number;
    name: string;
    rank: string;
    currency: string;
    viewHours: number;
};

async function loadFile(filepath: string): Promise<{ name: string, data: unknown[][] }[]> {
    try {
        return xlsx.parse(await fsp.readFile(filepath));
    } catch (error) {
        logger.error("Error reading Streamlabs Chatbot import file", error);
    }
}

function splitQuotes(quotes: string[][]): Quote[] {
    return quotes.map((q) => {
        const splittedQuote = q[1].split("[").map(sq => sq.replace("]", "").trim());

        if (splittedQuote.length > 3) {
            splittedQuote[0] = splittedQuote.slice(0, splittedQuote.length - 2).join(" ");
        }

        return {
            _id: Number(q[0]) + 1,
            text: splittedQuote[0],
            originator: "",
            creator: "",
            game: splittedQuote[splittedQuote.length - 2],
            createdAt: splittedQuote[splittedQuote.length - 1]
        } as Quote;
    });
};

function getQuoteDateFormat(quotes: Quote[]): string {
    let dateFormat: string;

    quotes.forEach((q) => {
        const dateArray = q.createdAt.split("-");

        if (parseInt(dateArray[0]) > 12) {
            dateFormat = "DD-MM-YYYY";
            return false;
        } else if (parseInt(dateArray[1]) > 12) {
            dateFormat = "MM-DD-YYYY";
            return false;
        }
    });

    return dateFormat;
};

function mapViewers(data: string[][]): StreamlabsViewer[] {
    let i = 0;
    return data.map((v) => {
        i++;

        return {
            id: i,
            name: v[0],
            rank: v[1],
            currency: v[2],
            viewHours: Number(v[3])
        } as StreamlabsViewer;
    });
};

function mapRanks(viewers: StreamlabsViewer[]): string[] {
    const viewerRanks = viewers.map(v => v.rank);
    const ranks = viewerRanks.reduce((allRanks, rank) => {
        if (!allRanks.includes(rank) && rank !== "Unranked") {
            allRanks.push(rank);
        }

        return allRanks;
    }, [] as string[]);

    return ranks;
};

async function addViewersFromTwitch(viewers: StreamlabsViewer[]): Promise<FirebotViewer[]> {
    const twitchViewers: HelixUser[] = [];

    const nameGroups: StreamlabsViewer[][] = [];
    while (viewers.length > 0) {
        nameGroups.push(viewers.splice(0, 100));
    }

    for (const group of nameGroups) {
        try {
            const names = group.map(v => v.name);
            const response = await TwitchApi.users.getUsersByNames(names);

            if (response) {
                twitchViewers.push(...response);
            }
        } catch (err) {
            logger.error("Failed to get users", { location: "/import/third-party/streamlabs.chatbot.js:35", err: err as unknown });

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (err._statusCode === 400) {
                for (const viewer of group) {
                    try {
                        const response = await TwitchApi.users.getUserByName(viewer.name);

                        if (response) {
                            twitchViewers.push(response);
                        }
                    } catch (err) {
                        logger.error("Failed to get user", { location: "/import/third-party/streamlabs.chatbot.js:46", err: err as unknown });
                    }
                }
            }
        }
    }

    const newViewers: FirebotViewer[] = [];
    for (const viewer of twitchViewers) {
        const roles = await chatRolesManager.getUsersChatRoles(viewer.id);

        const newViewer = await viewerDatabase.createNewViewer(
            viewer.id,
            viewer.name,
            viewer.displayName,
            viewer.profilePictureUrl,
            roles
        );

        if (newViewer) {
            newViewers.push(newViewer);
        } else {
            logger.error("Failed to create new user", { location: "/import/third-party/streamlabs.chatbot.js:68" });
        }
    }

    return newViewers ?? [];
};

async function importViewers(data: { viewers: StreamlabsViewer[], settings: Settings["viewers"] }) {
    logger.debug(`Attempting to import viewers...`);

    const { viewers, settings } = data;

    const newViewers: StreamlabsViewer[] = [];
    let viewersToUpdate: FirebotViewer[] = [];

    for (const v of viewers) {
        v.name = String(v.name);
        const viewer = await viewerDatabase.getViewerByUsername(v.name);

        if (viewer == null) {
            newViewers.push(v);
            continue;
        }

        viewersToUpdate.push(viewer);
    }

    const createdViewers = await addViewersFromTwitch(newViewers);

    if (createdViewers.length) {
        viewersToUpdate = [
            ...viewersToUpdate,
            ...createdViewers
        ];
    }

    for (const viewer of viewersToUpdate) {
        const viewerToUpdate = viewer;
        const importedViewer = viewers.find(v => v.name.toLowerCase() === viewer.username.toLowerCase());

        if (settings.includeViewHours) {
            viewerToUpdate.minutesInChannel += importedViewer.viewHours * 60;
        }

        await viewerDatabase.updateViewer(viewerToUpdate);
    }

    logger.debug(`Finished importing viewers`);
    return true;
};

export const StreamlabsChatbotImporter: ThirdPartyImporter<Settings> = {
    id: "streamlabs-chatbot",
    appName: "Streamlabs Chatbot",
    filetypes: [
        { name: "Microsoft Excel", extensions: ["xlsx"] }
    ],
    defaultSettings: {
        viewers: {
            includeViewHours: true,
            includeZeroHoursViewers: true
        }
    },
    loadQuotes: async (filepath) => {
        const sheets = await loadFile(filepath);
        let data: ParsedQuotes;

        for (const sheet of sheets) {
            if (sheet.name === "Quotes") {
                const quotes = splitQuotes(sheet.data as string[][]);
                const dateFormat = getQuoteDateFormat(quotes);

                quotes.forEach(q => q.createdAt = DateTime
                    .fromFormat(q.createdAt, dateFormat).toISO()
                );

                data = { quotes };

                break;
            }
        }

        if (data) {
            return {
                success: true,
                data
            };
        }

        return {
            success: false,
            error: "No quote data found"
        };
    },
    loadViewers: async (filepath) => {
        const sheets = await loadFile(filepath);
        let data: ParsedViewers<StreamlabsViewer>;

        for (const sheet of sheets) {
            if (sheet.name === "Points" || sheet.name === "Currency") {
                const viewers = mapViewers(sheet.data as string[][]);
                data = {
                    viewers: viewers,
                    ranks: mapRanks(viewers)
                };

                break;
            }
        }

        if (data) {
            return {
                success: true,
                data
            };
        }

        return {
            success: false,
            error: "No viewer data found"
        };
    },

    importViewers: async (viewers: StreamlabsViewer[], settings) => {
        try {
            await importViewers({ viewers, settings });
        } catch (error) {
            logger.error("Unexpected error importing viewers", error);
            return {
                success: false,
                error: (error as Error).message
            };
        }

        return {
            success: true
        };
    }
};