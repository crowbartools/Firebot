import fsp from "fs/promises";
import { DateTime } from "luxon";

import type { ThirdPartyImporter } from "../../../types/import";
import type { Quote } from "../../../types/quotes";
import type { HelixUser } from "@twurple/api";

import { QuoteManager } from "../../quotes/quote-manager";
import viewerDatabase from "../../viewers/viewer-database";
import { TwitchApi } from "../../streaming-platforms/twitch/api";
import chatRolesManager from "../../roles/chat-roles-manager";

import logger from "../../logwrapper";

interface Settings {
    viewers: {
        includeZeroViewTimeViewers: boolean;
        existingViewers: "merge" | "replace" | "skip";
    };
}

type ImportedFirebotViewer = {
    id: string;
    username: string;
    displayName: string;
    lastSeen: string;
    joinDate: string;
    minutesInChannel: number;
    chatMessages: number;
}

const addViewersFromTwitch = async (viewers: ImportedFirebotViewer[]): Promise<HelixUser[]> => {
    const twitchViewers: HelixUser[] = [];

    const nameGroups: ImportedFirebotViewer[][] = [];
    while (viewers.length > 0) {
        nameGroups.push(viewers.splice(0, 100));
    }

    for (const group of nameGroups) {
        try {
            const ids = group.map(v => v.id);
            const response = await TwitchApi.users.getUsersByIds(ids);

            if (response) {
                twitchViewers.push(...response);
            }
        } catch (err) {
            logger.error("Failed to get users", { err: err as unknown });

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (err._statusCode === 400) {
                for (const viewer of group) {
                    try {
                        const response = await TwitchApi.users.getUserByName(viewer.username);

                        if (response) {
                            twitchViewers.push(response);
                        }
                    } catch (err) {
                        logger.error("Failed to get user", { err: err as unknown });
                    }
                }
            }
        }
    }

    return twitchViewers;
};

const addNewViewersToDatabase = async (viewers: ImportedFirebotViewer[]): Promise<boolean> => {
    const twitchViewers = await addViewersFromTwitch(viewers);

    for (const viewer of twitchViewers) {
        const roles = await chatRolesManager.getUsersChatRoles(viewer.id);
        
        const importedViewer = viewers.find(v => viewer.id === v.id);
        const newViewer = await viewerDatabase.createNewViewer(
            viewer.id,
            viewer.name,
            viewer.displayName,
            viewer.profilePictureUrl,
            roles,
            false,
            DateTime.fromISO(importedViewer.lastSeen).toMillis(),
            DateTime.fromISO(importedViewer.joinDate).toMillis(),
            importedViewer.minutesInChannel,
            importedViewer.chatMessages
        );

        if (newViewer == null) {
            logger.error("Failed to create new user", { location: "/import/third-party/streamlabs.chatbot.js:68" });
        }
    }

    return true;
};

export const FirebotImporter: ThirdPartyImporter<Settings> = {
    id: "firebot",
    appName: "Firebot",
    filetypes: [
        { name: "CSV File", extensions: ["csv"] }
    ],
    defaultSettings: {
        viewers: {
            includeZeroViewTimeViewers: true,
            existingViewers: "merge"
        }
    },
    loadQuotes: async (filepath) => {
        try {
            const fileLines = (await fsp.readFile(filepath, { encoding: "utf8" }))
                .split(/\r?\n/);

            const headers = [
                "ID",
                "Text",
                "Originator",
                "Creator",
                "Category",
                "Created"
            ];
            // Validate header
            const header = fileLines.shift();
            if (header !== headers.join(",")) {
                return {
                    success: false,
                    error: "Invalid file format"
                };
            }

            const existingQuotes = await QuoteManager.getAllQuotes();

            const quotes: Quote[] = [];
            fileLines.forEach((line) => {
                // First we need the text of the quote, because the text can contain commas.
                const splittedQuote = line.split('"');

                const id = splittedQuote.shift().split(",")[0];
                const metadata = splittedQuote.pop().split(",");
                const text = splittedQuote.join("");

                if (existingQuotes.some(q => q.text.split('"').join("") === text)) {
                    return;
                }

                // We're getting the comma off first, then get the rest.
                // Game comes last, since a game/category can contain commas.
                metadata.shift();
                const originator = metadata.shift();
                const creator = metadata.shift();
                const createdAt = metadata.pop();
                const game = metadata.join(",");

                quotes.push({
                    _id: Number(id),
                    text: text,
                    originator: originator,
                    creator: creator,
                    game: game,
                    createdAt: createdAt
                });
            });

            return {
                success: true,
                data: {
                    quotes
                }
            };
        } catch (error) {
            logger.error(`Unexpected error while parsing Firebot quotes`, error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    },
    loadViewers: async (filepath) => {
        try {
            const fileLines = (await fsp.readFile(filepath, { encoding: "utf8" }))
            .split(/\r?\n/);

        const headers = [
            "ID",
            "Username",
            "Last Seen",
            "Join Date",
            "Minutes in Channel",
            "Chat Messages"
        ];

        // Validate header
        const header = fileLines.shift();
        if (header !== headers.join(",")) {
            return {
                success: false,
                error: "Invalid file format"
            };
        }

        const viewers: ImportedFirebotViewer[] = [];
            fileLines.forEach(line => {
                const viewerData = line.split(",");
                    
                viewers.push({
                    id: viewerData[0],
                    username: viewerData[1].toLowerCase(),
                    displayName: viewerData[1],
                    lastSeen: viewerData[2],
                    joinDate: viewerData[3],
                    minutesInChannel: Number(viewerData[4]),
                    chatMessages: Number(viewerData[5])
                });
            });

            return {
                success: true,
                data: {
                    viewers,
                    ranks: []
                }
            };
        } catch (error) {
            logger.error(`Unexpected error while parsing Firebot viewers`, error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    },
    importViewers: async (viewersToImport: ImportedFirebotViewer[], settings) => {
        try {
            // If the viewer db is empty, we can skip most stuff.
            const currentViewers = await viewerDatabase.getAllViewers();
            if (!currentViewers.length) {
                const importedViewers = await addViewersFromTwitch(viewersToImport);

                if (importedViewers) {
                    return {
                        success: true
                    };
                }
            }

            const newViewers: ImportedFirebotViewer[] = [];
            let viewersToUpdate: FirebotViewer[] = [];

            for (const v of viewersToImport) {
                const viewer = await viewerDatabase.getViewerById(v.id);

                if (viewer == null) {
                    newViewers.push(v);
                    continue;
                }

                switch (settings.existingViewers) {
                    case "replace":
                        newViewers.push(v);
                    case "merge":
                        viewersToUpdate.push(viewer);
                    case "skip":
                    default:
                        break;
                }
            }

            for (const viewer of viewersToUpdate) {
                const viewerToUpdate = viewer;
                const viewerToImport = viewersToImport.find(v => v.username.toLowerCase() === viewer.username.toLowerCase());

                viewerToUpdate.minutesInChannel += viewerToImport.minutesInChannel;
                viewerToUpdate.chatMessages += viewerToImport.chatMessages;

                const importedJoinDate = DateTime.fromISO(viewerToImport.joinDate).toMillis();
                if (viewerToUpdate.joinDate > importedJoinDate) {
                    viewerToUpdate.joinDate = importedJoinDate;
                }

                const importedLastSeen = DateTime.fromISO(viewerToImport.lastSeen).toMillis();
                if (viewerToUpdate.lastSeen < importedLastSeen) {
                    viewerToUpdate.lastSeen = importedLastSeen;
                }

                await viewerDatabase.updateViewer(viewerToUpdate);
            }

            await addNewViewersToDatabase(newViewers);

            logger.debug(`Finished importing viewers`);
            return {
                success: true
            };
        } catch (error) {
            logger.error("Unexpected error importing Firebot viewers", error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }
};