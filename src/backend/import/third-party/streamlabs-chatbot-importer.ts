import fsp from "fs/promises";
import xlsx from "node-xlsx";
import { DateTime } from "luxon";
import type { HelixUser } from "@twurple/api";

import type { ParsedQuotes, ParsedViewers, ThirdPartyImporter } from "../../../types/import";
import type { Quote } from "../../../types/quotes";

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

const loadFile = async (filepath: string): Promise<{ name: string, data: unknown[][] }[]> => {
    try {
        return xlsx.parse(await fsp.readFile(filepath));
    } catch (error) {
        logger.error("Error reading Streamlabs Chatbot import file", error);
    }
}

const splitQuotes = (quotes: string[][]): Quote[] => {
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

const getQuoteDateFormat = (quotes: Quote[]): string => {
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

const mapViewers = (data: string[][]): StreamlabsViewer[] => {
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

const mapRanks = (viewers: StreamlabsViewer[]): string[] => {
    const viewerRanks = viewers.map(v => v.rank);
    const ranks = viewerRanks.reduce((allRanks, rank) => {
        if (!allRanks.includes(rank) && rank !== "Unranked") {
            allRanks.push(rank);
        }

        return allRanks;
    }, [] as string[]);

    return ranks;
};

const addViewersFromTwitch = async (viewers: StreamlabsViewer[]): Promise<HelixUser[]> => {
    const twitchViewers: HelixUser[] = [];
    const viewersToAdd = [...viewers];

    const nameGroups: StreamlabsViewer[][] = [];
    while (viewersToAdd.length > 0) {
        nameGroups.push(viewersToAdd.splice(0, 100));
    }

    for (const group of nameGroups) {
        try {
            const names = group.map(v => v.name);
            const response = await TwitchApi.users.getUsersByNames(names);

            if (response) {
                twitchViewers.push(...response);
            }
        } catch (err) {
            logger.error("Failed to get users", { location: "/import/third-party/streamlabs-chatbot.js:121", err: err as unknown });

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (err._statusCode === 400) {
                for (const viewer of group) {
                    try {
                        const response = await TwitchApi.users.getUserByName(viewer.name);

                        if (response) {
                            twitchViewers.push(response);
                        }
                    } catch (err) {
                        logger.error("Failed to get user", { location: "/import/third-party/streamlabs-chatbot.js:133", err: err as unknown });
                    }
                }
            }
        }
    }

    return twitchViewers;
};

const addNewViewers = async (viewers: StreamlabsViewer[], settings: Settings["viewers"]): Promise<void> => {
    const twitchViewers = await addViewersFromTwitch(viewers);

    try {
        for (const viewer of twitchViewers) {
            const roles = await chatRolesManager.getUsersChatRoles(viewer.id);
            const importedViewer = viewers.find(v => v.name.toLowerCase() === viewer.name.toLowerCase());

            viewerDatabase.createNewViewer({
                id: viewer.id,
                username: viewer.name,
                displayName: viewer.displayName,
                profilePicUrl: viewer.profilePictureUrl,
                twitchRoles: roles,
                minutesInChannel: settings.includeViewHours ? importedViewer.viewHours * 60 : 0
            });
        }
    } catch (error) {
        logger.error("Failed to create new user", { location: "/import/third-party/streamlabs-chatbot.js:161", error: error });
    }
};

const importViewers = async (data: { viewers: StreamlabsViewer[], settings: Settings["viewers"] }) => {
    logger.debug(`Attempting to import viewers...`);

    const { viewers, settings } = data;
    const existingViewers = await viewerDatabase.getAllViewers();

    if (!existingViewers.length) {
        await addNewViewers(viewers, settings);
        return true;
    }

    const newViewers: StreamlabsViewer[] = [];

    for (const v of viewers) {
        v.name = String(v.name);
        const viewer = existingViewers.find(ev => ev.username.toLowerCase() === v.name.toLowerCase());

        if (viewer == null) {
            newViewers.push(v);
            continue;
        }

        if (settings.includeViewHours) {
            viewer.minutesInChannel += v.viewHours * 60;
        }

        try {
            await viewerDatabase.updateViewer(viewer);
        } catch (error) {
            logger.error("Failed to update user", { location: "/import/third-party/streamlabs-chatbot.js:194", error: error });
        }
    }

    await addNewViewers(newViewers, settings);

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