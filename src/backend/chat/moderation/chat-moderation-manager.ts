import { JsonDB } from "node-json-db";
import fsp from "fs/promises";
import logger from "../../logwrapper";
import profileManager from "../../common/profile-manager";
import frontendCommunicator from "../../common/frontend-communicator";
import rolesManager from "../../roles/custom-roles-manager";
import permitCommand from "./url-permit-command";
import utils from "../../utility";
import { FirebotChatMessage } from "../../../types/chat";
import viewerDatabase from '../../viewers/viewer-database';
import twitchApi from "../../twitch-api/api";

export interface ModerationTerm {
    text: string;
    createdAt: number;
}

export interface ModerationUser {
    id: string;
    username: string;
    displayName: string;
}

export interface AllowedUser {
    id: string;
    username: string;
    displayName: string;
    createdAt: number;
}

export interface BannedWords {
    words: ModerationTerm[];
}

export interface BannedRegularExpressions {
    regularExpressions: ModerationTerm[];
}

export interface AllowList {
    urls: ModerationTerm[];
    users: AllowedUser[];
}

export interface ModerationImportRequest {
    filePath: string;
    delimiter: "newline" | "comma" | "space";
}

export interface ChatModerationSettings {
    bannedWordList: {
        enabled: boolean;
        exemptRoles: string[];
        outputMessage?: string;
    };
    emoteLimit: {
        enabled: boolean;
        exemptRoles: string[];
        max: number;
        outputMessage?: string;
    };
    urlModeration: {
        enabled: boolean;
        exemptRoles: string[];
        viewTime: {
            enabled: boolean;
            viewTimeInHours: number;
        };
        outputMessage?: string;
    };
    exemptRoles: string[];
}

class ChatModerationManager {
    bannedWords: BannedWords = { words: [] };
    bannedRegularExpressions: BannedRegularExpressions = { regularExpressions: [] };
    allowlist: AllowList = { 
        urls: [], 
        users: [] 
    };
    chatModerationSettings: ChatModerationSettings = {
        bannedWordList: {
            enabled: false,
            exemptRoles: [],
            outputMessage: ""
        },
        emoteLimit: {
            enabled: false,
            exemptRoles: [],
            max: 10,
            outputMessage: ""
        },
        urlModeration: {
            enabled: false,
            exemptRoles: [],
            viewTime: {
                enabled: false,
                viewTimeInHours: 0
            },
            outputMessage: ""
        },
        exemptRoles: []
    };

    constructor() {
        frontendCommunicator.on("chat-moderation:add-banned-words", (words: string[]): boolean => {
            return this.addBannedWords(words);
        });

        frontendCommunicator.on("chat-moderation:remove-banned-word", (wordText: string): boolean => {
            return this.removeBannedWord(wordText);
        });

        frontendCommunicator.on("chat-moderation:remove-all-banned-words", (): boolean => {
            return this.removeAllBannedWords();
        });

        frontendCommunicator.onAsync("chat-moderation:import-banned-words", async (request: ModerationImportRequest) => {
            return await this.importBannedWordList(request);
        });

        frontendCommunicator.on("chat-moderation:add-banned-regular-expression", (expression: string): boolean => {
            return this.addBannedRegularExpression(expression);
        });

        frontendCommunicator.on("chat-moderation:remove-banned-regular-expression", (expressionText: string): boolean => {
            return this.removeBannedRegularExpression(expressionText);
        });

        frontendCommunicator.on("chat-moderation:remove-all-banned-regular-expressions", (): boolean => {
            return this.removeAllBannedRegularExpressions();
        });

        frontendCommunicator.on("chat-moderation:add-allowed-urls", (urls: string[]): boolean => {
            return this.addAllowedUrls(urls);
        });

        frontendCommunicator.on("chat-moderation:remove-allowed-url", (urlText: string): boolean => {
            return this.removeAllowedUrl(urlText);
        });

        frontendCommunicator.on("chat-moderation:remove-all-allowed-urls", (): boolean => {
            return this.removeAllAllowedUrls();
        });

        frontendCommunicator.onAsync("chat-moderation:import-url-allowlist", async (request: ModerationImportRequest) => {
            return await this.importUrlAllowlist(request);
        });

        frontendCommunicator.on("chat-moderation:add-allowed-user", (user: ModerationUser): boolean => {
            return this.addAllowedUser(user);
        });

        frontendCommunicator.on("chat-moderation:remove-allowed-user", (id: string): boolean => {
            return this.removeAllowedUser(id);
        });

        frontendCommunicator.on("chat-moderation:remove-all-allowed-users", (): boolean => {
            return this.removeAllAllowedUsers();
        });

        frontendCommunicator.on("chat-moderation:update-chat-moderation-settings", (settings: ChatModerationSettings): boolean => {
            return this.saveChatModerationSettings(settings);
        });

        frontendCommunicator.on("chat-moderation:get-chat-moderation-data", () => {
            return {
                settings: this.chatModerationSettings,
                bannedWords: this.bannedWords.words,
                bannedRegularExpressions: this.bannedRegularExpressions.regularExpressions,
                urlAllowlist: this.allowlist.urls,
                userAllowlist: this.allowlist.users
            };
        });
    }

    // Banned words

    private getBannedWordsDb(): JsonDB {
        return profileManager.getJsonDbInProfile("/chat/moderation/banned-words", false);
    }

    private getBannedWordsList(): string[] {
        if (!this.bannedWords || !this.bannedWords.words) {
            return [];
        }
        return this.bannedWords.words.map(w => w.text);
    }

    private addBannedWords(words: string[]): boolean {
        this.bannedWords.words = this.bannedWords.words.concat(words.map((w) => {
            return {
                text: w,
                createdAt: new Date().valueOf()
            };
        }));
        return this.saveBannedWordList();
    }

    private removeBannedWord(wordText: string): boolean {
        this.bannedWords.words = this.bannedWords.words.filter(w => w.text.toLowerCase() !== wordText);
        return this.saveBannedWordList();
    }

    private removeAllBannedWords(): boolean {
        this.bannedWords.words = [];
        return this.saveBannedWordList();
    }

    private async importBannedWordList(request: ModerationImportRequest): Promise<boolean> {
        const { filePath, delimiter } = request;
        let contents: string;

        try {
            contents = await fsp.readFile(filePath, { encoding: "utf8" });
        } catch (err) {
            logger.error("Error reading file for banned words", err);
            return false;
        }

        let words: string[] = [];
        if (delimiter === "newline") {
            words = contents.replace(/\r\n/g, "\n").split("\n");
        } else if (delimiter === "comma") {
            words = contents.split(",");
        } else if (delimiter === "space") {
            words = contents.split(" ");
        }

        if (words?.length) {
            this.addBannedWords(words);
        }

        return true;
    }

    private saveBannedWordList(): boolean {
        let success = false;

        try {
            this.getBannedWordsDb().push("/", this.bannedWords);
            success = true;
        } catch (error) {
            if (error.name === 'DatabaseError') {
                logger.error("Error saving banned words data", error);
            }
        }

        frontendCommunicator.send("chat-moderation:banned-word-list-updated", this.bannedWords.words);

        return success;
    }


    // Regular Expressions

    private getBannedRegularExpressionsDb(): JsonDB {
        return profileManager.getJsonDbInProfile("/chat/moderation/banned-regular-expressions", false);
    }

    private getBannedRegularExpressionsList(): string[] {
        if (!this.bannedRegularExpressions || !this.bannedRegularExpressions.regularExpressions) {
            return [];
        }
        return this.bannedRegularExpressions.regularExpressions.map(r => r.text);
    }

    private addBannedRegularExpression(expression: string): boolean {
        this.bannedRegularExpressions.regularExpressions.push({
            text: expression,
            createdAt: new Date().valueOf()
        });
        return this.saveBannedRegularExpressionsList();
    }

    private removeBannedRegularExpression(expressionText: string): boolean {
        this.bannedRegularExpressions.regularExpressions = this.bannedRegularExpressions.regularExpressions.filter(r => r.text !== expressionText);
        return this.saveBannedRegularExpressionsList();
    }

    private removeAllBannedRegularExpressions(): boolean {
        this.bannedRegularExpressions.regularExpressions = [];
        return this.saveBannedRegularExpressionsList();
    }

    private saveBannedRegularExpressionsList(): boolean {
        let success = false;

        try {
            this.getBannedRegularExpressionsDb().push("/", this.bannedRegularExpressions);
            success = true;
        } catch (error) {
            if (error.name === 'DatabaseError') {
                logger.error("Error saving banned regular expressions data", error);
            }
        }

        frontendCommunicator.send("chat-moderation:banned-regex-list-updated", this.bannedRegularExpressions.regularExpressions);

        return success;
    }

    private getAllowlistDb(): JsonDB {
        return profileManager.getJsonDbInProfile("/chat/moderation/url-allowlist", false);
    }


    // URL Allow List

    private getUrlAllowlist(): string[] {
        if (!this.allowlist || !this.allowlist.urls) {
            return [];
        }
        return this.allowlist.urls.map(u => u.text);
    }

    private addAllowedUrls(urls: string[]): boolean {
        this.allowlist.urls = this.allowlist.urls.concat(urls.map((u) => {
            return {
                text: u,
                createdAt: new Date().valueOf()
            };
        }));
        return this.saveUrlAllowlist();
    }

    private removeAllowedUrl(urlText: string): boolean {
        this.allowlist.urls = this.allowlist.urls.filter(u => u.text.toLowerCase() !== urlText);
        return this.saveUrlAllowlist();
    }

    private removeAllAllowedUrls(): boolean {
        this.allowlist.urls = [];
        return this.saveUrlAllowlist();
    }

    private async importUrlAllowlist(request: ModerationImportRequest): Promise<boolean> {
        const { filePath, delimiter } = request;

        let contents: string;
        try {
            contents = await fsp.readFile(filePath, { encoding: "utf8" });
        } catch (err) {
            logger.error("Error reading file for allowed URLs", err);
            return false;
        }

        let urls: string[] = [];
        if (delimiter === 'newline') {
            urls = contents.replace(/\r\n/g, "\n").split("\n");
        } else if (delimiter === "comma") {
            urls = contents.split(",");
        } else if (delimiter === "space") {
            urls = contents.split(" ");
        }

        if (urls?.length) {
            this.addAllowedUrls(urls);
        }

        return true;
    }

    private saveUrlAllowlist(): boolean {
        let success = false;

        try {
            this.getAllowlistDb().push("/", this.allowlist);
            success = true;
        } catch (error) {
            if (error.name === 'DatabaseError') {
                logger.error("Error saving URL allowlist data", error);
            }
        }

        frontendCommunicator.send("chat-moderation:url-allowlist-updated", this.allowlist.urls);

        return success;
    }

    // User Allowlist

    private getUserAllowlist(): string[] {
        if (!this.allowlist || !this.allowlist.users) {
            return [];
        }
        return this.allowlist.users.map(u => u.username);
    }

    private addAllowedUser(user: ModerationUser): boolean {
        if (!this.allowlist.users) {
            this.allowlist.users = [];
        }

        if (this.allowlist.users.find(u => u.id === user.id)) {
            return;
        }

        this.allowlist.users.push({
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            createdAt: new Date().valueOf()
        });

        return this.saveUserAllowlist();
    }

    private removeAllowedUser(id: string): boolean {
        this.allowlist.users = this.allowlist.users.filter(u => u.id !== id);
        return this.saveUserAllowlist();
    }

    private removeAllAllowedUsers(): boolean {
        this.allowlist.users = [];
        return this.saveUserAllowlist();
    }

    private saveUserAllowlist(): boolean {
        let success = false;

        try {
            this.getAllowlistDb().push("/", this.allowlist);
            success = true;
        } catch (error) {
            if (error.name === 'DatabaseError') {
                logger.error("Error saving user allowlist data", error);
            }
        }

        frontendCommunicator.send("chat-moderation:user-allowlist-updated", this.allowlist.users);

        return success;
    }

    // Moderation Settings

    private getChatModerationSettingsDb(): JsonDB {
        return profileManager.getJsonDbInProfile("/chat/moderation/chat-moderation-settings");
    }

    private saveChatModerationSettings(settings: ChatModerationSettings): boolean {
        let success = false;

        try {
            this.chatModerationSettings = settings;
            this.getChatModerationSettingsDb().push("/", this.chatModerationSettings);
            success = true;
        } catch (error) {
            if (error.name === 'DatabaseError') {
                logger.error("Error saving chat moderation settings", error);
            }
        }

        frontendCommunicator.send("chat-moderation:chat-moderation-settings-updated", this.chatModerationSettings);

        return success;
    }


    // Helper functions

    private countEmojis(str: string): number {
        const re = /\p{Extended_Pictographic}/ug;
        return ((str || '').match(re) || []).length;
    }

    private hasBannedWord(input: string): boolean {
        input = input.toLowerCase();
        return this.getBannedWordsList()
            .some((word) => {
                return input.split(" ").includes(word);
            });
    }

    private matchesBannedRegex(input: string) {
        const expressions = this.getBannedRegularExpressionsList().reduce(function(newArray, regex) {
            try {
                newArray.push(new RegExp(regex, "gi"));
            } catch (error) {
                logger.warn(`Unable to parse banned RegEx: ${regex}`, error);
            }

            return newArray;
        }, []);
        const inputWords = input.split(" ");

        for (const exp of expressions) {
            for (const word of inputWords) {
                if (exp.test(word)) {
                    return true;
                }
            }
        }

        return false;
    }

    private async deleteMessage(messageId: string, outputMessage?: string, username?: string) {
        await twitchApi.chat.deleteChatMessage(messageId);

        if (outputMessage?.length) {
            outputMessage = outputMessage.replace("{userName}", username);
            await twitchApi.chat.sendChatMessage(outputMessage);
        }
    }


    // Public functions

    load() {
        try {
            const settings: ChatModerationSettings = this.getChatModerationSettingsDb().getData("/");
            if (settings && Object.keys(settings).length > 0) {
                this.chatModerationSettings = settings;
                if (settings.exemptRoles == null) {
                    settings.exemptRoles = [];
                }

                if (settings.bannedWordList == null) {
                    settings.bannedWordList = {
                        enabled: false,
                        exemptRoles: [],
                        outputMessage: ""
                    };
                }

                if (settings.bannedWordList.exemptRoles == null) {
                    settings.bannedWordList.exemptRoles = [];
                }

                if (settings.bannedWordList.outputMessage == null) {
                    settings.bannedWordList.outputMessage = "";
                }

                if (settings.emoteLimit == null) {
                    settings.emoteLimit = {
                        enabled: false,
                        exemptRoles: [],
                        max: 10,
                        outputMessage: ""
                    };
                }

                if (settings.emoteLimit.exemptRoles == null) {
                    settings.emoteLimit.exemptRoles = [];
                }

                if (settings.emoteLimit.outputMessage == null) {
                    settings.emoteLimit.outputMessage = "";
                }

                if (settings.urlModeration == null) {
                    settings.urlModeration = {
                        enabled: false,
                        exemptRoles: [],
                        viewTime: {
                            enabled: false,
                            viewTimeInHours: 0
                        },
                        outputMessage: ""
                    };
                }

                if (settings.urlModeration.exemptRoles == null) {
                    settings.urlModeration.exemptRoles = [];
                }

                if (settings.urlModeration.enabled) {
                    permitCommand.registerPermitCommand();
                }
            }

            const words: BannedWords = this.getBannedWordsDb().getData("/");
            if (words && Object.keys(words).length > 0) {
                this.bannedWords = words;
            }

            const regularExpressions: BannedRegularExpressions = this.getBannedRegularExpressionsDb().getData("/");
            if (regularExpressions && Object.keys(regularExpressions).length > 0) {
                this.bannedRegularExpressions = regularExpressions;
            }

            const allowlist: AllowList = this.getAllowlistDb().getData("/");
            if (allowlist && Object.keys(allowlist).length > 0) {
                this.allowlist = allowlist;
            }
        } catch (error) {
            if (error.name === 'DatabaseError') {
                logger.error("Error loading chat moderation data", error);
            }
        }
    }

    async moderateMessage(chatMessage: FirebotChatMessage) {
        if (chatMessage == null) {
            return;
        }

        if (!this.chatModerationSettings.bannedWordList.enabled
            && !this.chatModerationSettings.emoteLimit.enabled
            && !this.chatModerationSettings.urlModeration.enabled
        ) {
            return;
        }

        const userExemptGlobally = rolesManager.userIsInRole(chatMessage.userId, chatMessage.roles,
            this.chatModerationSettings.exemptRoles);

        if (userExemptGlobally) {
            return;
        }

        const userExemptForBannedWords = rolesManager.userIsInRole(chatMessage.userId, chatMessage.roles, this.chatModerationSettings.bannedWordList.exemptRoles);
        if (this.chatModerationSettings.bannedWordList.enabled
            && !userExemptForBannedWords) {
            const bannedWordFound = this.hasBannedWord(chatMessage.rawText);
            if (bannedWordFound) {
                await this.deleteMessage(chatMessage.id, this.chatModerationSettings.bannedWordList.outputMessage, chatMessage.userDisplayName);
                return;
            }

            const bannedRegexMatched = this.matchesBannedRegex(chatMessage.rawText);
            if (bannedRegexMatched) {
                await this.deleteMessage(chatMessage.id, this.chatModerationSettings.bannedWordList.outputMessage, chatMessage.userDisplayName);
                return;
            }
        }

        const userExemptForEmoteLimit = rolesManager.userIsInRole(chatMessage.userId, chatMessage.roles, this.chatModerationSettings.emoteLimit.exemptRoles);
        if (this.chatModerationSettings.emoteLimit.enabled && !!this.chatModerationSettings.emoteLimit.max && !userExemptForEmoteLimit) {
            const emoteCount = chatMessage.parts.filter(p => p.type === "emote").length;
            const emojiCount = chatMessage.parts
                .filter(p => p.type === "text")
                .reduce((acc, part) => acc + this.countEmojis(part.text), 0);
            if ((emoteCount + emojiCount) > this.chatModerationSettings.emoteLimit.max) {
                await this.deleteMessage(chatMessage.id, this.chatModerationSettings.emoteLimit.outputMessage, chatMessage.userDisplayName);
                return;
            }
        }

        const userExemptForUrlModeration = rolesManager.userIsInRole(chatMessage.userId, chatMessage.roles, this.chatModerationSettings.urlModeration.exemptRoles);
        if (this.chatModerationSettings.urlModeration.enabled
            && !userExemptForUrlModeration
            && !permitCommand.hasTemporaryPermission(chatMessage.username)
            && !permitCommand.hasTemporaryPermission(chatMessage.userDisplayName.toLowerCase())
        ) {
            let shouldDeleteMessage = false;
            const message = chatMessage.rawText;
            const regex = utils.getUrlRegex();

            if (regex.test(message)) {
                logger.debug("URL moderation: Found URL in message");

                const settings = this.chatModerationSettings.urlModeration;
                const userAllowed = this.getUserAllowlist().find(u => u === chatMessage.username.toLowerCase());

                let outputMessage = settings.outputMessage || "";
                let disallowedUrlFound = false;

                // If the urlAllowlist is empty, ANY URL is disallowed
                if (this.allowlist.urls.length === 0) {
                    disallowedUrlFound = true;
                } else {
                    const urlsFound = message.match(regex);

                    // Go through the list of URLs found in the message...
                    for (let url of urlsFound) {
                        url = url.toLowerCase();

                        // And see if there's a matching rule in the allow list
                        const foundAllowlistRule = this.getUrlAllowlist().find(allowedUrl => url.includes(allowedUrl.toLowerCase()));

                        // If there isn't, we have at least one bad URL, so we flag the message and dip out
                        if (!foundAllowlistRule) {
                            disallowedUrlFound = true;
                            break;
                        }
                    }
                }

                if (disallowedUrlFound && !userAllowed) {
                    if (settings.viewTime && settings.viewTime.enabled) {
                        const viewer = await viewerDatabase.getViewerByUsername(chatMessage.username);

                        const viewerViewTime = viewer?.minutesInChannel ? viewer?.minutesInChannel / 60 : 0;
                        const minimumViewTime = settings.viewTime.viewTimeInHours;

                        if (viewerViewTime <= minimumViewTime) {
                            outputMessage = outputMessage.replace("{viewTime}", minimumViewTime.toString());

                            logger.debug("URL moderation: Not enough view time.");
                            shouldDeleteMessage = true;
                        }
                    } else {
                        shouldDeleteMessage = true;
                    }

                    if (shouldDeleteMessage) {
                        await this.deleteMessage(chatMessage.id, outputMessage, chatMessage.userDisplayName);
                        return;
                    }
                }
            }
        }
    }
}

const chatModerationManager = new ChatModerationManager();

export { chatModerationManager as ChatModerationManager };