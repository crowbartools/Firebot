"use strict";
const logger = require("../../logwrapper");
const profileManager = require("../../common/profile-manager");
const { Worker } = require("worker_threads");
const frontendCommunicator = require("../../common/frontend-communicator");
const rolesManager = require("../../roles/custom-roles-manager");
const permitCommand = require("./url-permit-command");

let getChatModerationSettingsDb = () => profileManager.getJsonDbInProfile("/chat/moderation/chat-moderation-settings");
let getBannedWordsDb = () => profileManager.getJsonDbInProfile("/chat/moderation/banned-words", false);
let getbannedRegularExpressionsDb = () => profileManager.getJsonDbInProfile("/chat/moderation/banned-regular-expressions", false);

// default settings
let chatModerationSettings = {
    spamRaidProtection: {
        cacheLimit: 50,
        characterLimit: 10
    },
    bannedWordList: {
        enabled: false,
        exemptRoles: []
    },
    emoteLimit: {
        enabled: false,
        exemptRoles: [],
        max: 10
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

let bannedWords = {
    words: []
};

let bannedRegularExpressions = {
    regularExpressions: []
};

function getBannedWordsList() {
    if (!bannedWords || !bannedWords.words) return [];
    return bannedWords.words.map(w => w.text);
}

function getBannedRegularExpressionsList() {
    if (!bannedRegularExpressions || !bannedRegularExpressions.regularExpressions) return [];
    return bannedRegularExpressions.regularExpressions.map(r => r.text);
}

function getChatModerationSettings() {
    return chatModerationSettings;
}

/**
 * @type Worker
 */
let moderationService = null;

function startModerationService() {
    if (moderationService != null) return;

    const chat = require("../twitch-chat");

    let servicePath = require("path").resolve(__dirname, "./moderation-service.js");

    if (servicePath.includes("app.asar")) {
        servicePath = servicePath.replace('app.asar', 'app.asar.unpacked');
    }

    moderationService = new Worker(servicePath);

    moderationService.on("message", event => {
        if (event == null) return;
        switch (event.type) {
        case "deleteMessage": {
            if (event.messageId) {
                logger.debug(`Chat message with id '${event.messageId}' contains a banned word. Deleting...`);
                chat.deleteMessage(event.messageId);
            }
            break;
        }
        }
    });

    moderationService.on("error", code => {
        logger.warn(`Moderation worker failed with code: ${code}.`);
        moderationService.unref();
        moderationService = null;
        //startModerationService();
    });

    moderationService.on("exit", code => {
        logger.debug(`Moderation service stopped with code: ${code}.`);
    });

    moderationService.postMessage(
        {
            type: "bannedWordsUpdate",
            words: getBannedWordsList()
        }
    );

    moderationService.postMessage(
        {
            type: "bannedRegexUpdate",
            regularExpressions: getBannedRegularExpressionsList()
        }
    );

    logger.info("Finished setting up chat moderation worker.");
}

function stopService() {
    if (moderationService != null) {
        moderationService.terminate();
        moderationService.unref();
        moderationService = null;
    }
}

const countEmojis = (str) => {
    const re = /\p{Extended_Pictographic}/ug; //eslint-disable-line
    return ((str || '').match(re) || []).length;
};

/**
 *
 * @param {import("../chat-helpers").FirebotChatMessage} chatMessage
 */
async function moderateMessage(chatMessage) {
    if (chatMessage == null) return;

    if (
        !chatModerationSettings.bannedWordList.enabled
        && !chatModerationSettings.emoteLimit.enabled
        && !chatModerationSettings.urlModeration.enabled
    ) return;

    let moderateMessage = false;

    const globalUserExempt = rolesManager.userIsInRole(chatMessage.username, chatMessage.roles,
        chatModerationSettings.exemptRoles);

    if (!globalUserExempt) {
        moderateMessage = true;
    }

    if (moderateMessage) {
        const chat = require("../twitch-chat");

        if (chatModerationSettings.emoteLimit.enabled && !!chatModerationSettings.emoteLimit.max) {
            const userExempt = rolesManager.userIsInRole(chatMessage.username, chatMessage.roles,
                chatModerationSettings.emoteLimit.exemptRoles);

            if (!userExempt) {
                const emoteCount = chatMessage.parts.filter(p => p.type === "emote").length;
                const emojiCount = chatMessage.parts
                    .filter(p => p.type === "text")
                    .reduce((acc, part) => acc + countEmojis(part.text), 0);
                if ((emoteCount + emojiCount) > chatModerationSettings.emoteLimit.max) {
                    chat.deleteMessage(chatMessage.id);
                    return;
                }
            }
        }

        if (chatModerationSettings.urlModeration.enabled) {
            if (!permitCommand.hasTemporaryPermission(chatMessage.username)) {
                const userExempt = rolesManager.userIsInRole(chatMessage.username, chatMessage.roles,
                    chatModerationSettings.urlModeration.exemptRoles);

                if (!userExempt) {
                    const message = chatMessage.rawText;
                    const regex = new RegExp(/[\w]{2,}[.][\w]{2,}/, "gi");

                    if (regex.test(message)) {
                        logger.debug("Url moderation: Found url in message...");

                        const settings = chatModerationSettings.urlModeration;
                        let outputMessage = settings.outputMessage || "";

                        if (settings.viewTime && settings.viewTime.enabled) {
                            const viewerDB = require('../../database/userDatabase');
                            const viewer = await viewerDB.getUserByUsername(chatMessage.username);

                            const viewerViewTime = viewer.minutesInChannel / 60;
                            const minimumViewTime = settings.viewTime.viewTimeInHours;

                            if (viewerViewTime <= minimumViewTime) {
                                outputMessage = outputMessage.replace("{viewTime}", minimumViewTime.toString());
                                logger.debug("Url moderation: Not enough view time.");
                            }
                        } else {
                            logger.debug("Url moderation: User does not have exempt role.");
                        }

                        chat.deleteMessage(chatMessage.id);

                        if (outputMessage) {
                            outputMessage = outputMessage.replace("{userName}", chatMessage.username);
                            chat.sendChatMessage(outputMessage);
                        }

                        return;
                    }

                }
            }
        }

        if (chatModerationSettings.bannedWordList.enabled) {
            const userExempt = rolesManager.userIsInRole(chatMessage.username, chatMessage.roles,
                chatModerationSettings.bannedWordList.exemptRoles);

            if (!userExempt) {
                const message = chatMessage.rawText;
                const messageId = chatMessage.id;

                moderationService.postMessage(
                    {
                        type: "moderateMessage",
                        message: message,
                        messageId: messageId
                    }
                );
            }
        }
    }
}

frontendCommunicator.on("chatModerationSettingsUpdate", settings => {
    chatModerationSettings = settings;
    try {
        getChatModerationSettingsDb().push("/", settings);
    } catch (error) {
        if (error.name === 'DatabaseError') {
            logger.error("Error saving chat moderation settings", error);
        }
    }
});

function saveBannedWordList() {
    try {
        getBannedWordsDb().push("/", bannedWords);
    } catch (error) {
        if (error.name === 'DatabaseError') {
            logger.error("Error saving banned words data", error);
        }
    }
    if (moderationService != null) {
        moderationService.postMessage(
            {
                type: "bannedWordsUpdate",
                words: getBannedWordsList()
            }
        );
    }
}

function saveBannedRegularExpressionsList() {
    try {
        getbannedRegularExpressionsDb().push("/", bannedRegularExpressions);
    } catch (error) {
        if (error.name === 'DatabaseError') {
            logger.error("Error saving banned regular expressions data", error);
        }
    }
    if (moderationService != null) {
        moderationService.postMessage(
            {
                type: "bannedRegexUpdate",
                regularExpressions: getBannedRegularExpressionsList()
            }
        );
    }
}

frontendCommunicator.on("addBannedWords", words => {
    bannedWords.words = bannedWords.words.concat(words);
    saveBannedWordList();
});

frontendCommunicator.on("removeBannedWord", wordText => {
    bannedWords.words = bannedWords.words.filter(w => w.text.toLowerCase() !== wordText);
    saveBannedWordList();
});

frontendCommunicator.on("removeAllBannedWords", () => {
    bannedWords.words = [];
    saveBannedWordList();
});

frontendCommunicator.on("addBannedRegularExpressions", regularExpressions => {
    bannedRegularExpressions.regularExpressions = bannedRegularExpressions.regularExpressions.concat(regularExpressions);
    saveBannedRegularExpressionsList();
});

frontendCommunicator.on("removeBannedRegularExpressions", regexText => {
    bannedRegularExpressions.regularExpressions = bannedRegularExpressions.regularExpressions.filter(r => r.text.toLowerCase() !== regexText);
    saveBannedRegularExpressionsList();
});

frontendCommunicator.on("removeAllRegularExpressions", () => {
    bannedRegularExpressions.regularExpressions = [];
    saveBannedRegularExpressionsList();
});

frontendCommunicator.on("getChatModerationData", () => {
    return {
        settings: chatModerationSettings,
        bannedWords: bannedWords.words,
        bannedRegularExpressions: bannedRegularExpressions.regularExpressions
    };
});

function load() {
    try {
        let settings = getChatModerationSettingsDb().getData("/");
        if (settings && Object.keys(settings).length > 0) {
            chatModerationSettings = settings;
            if (settings.exemptRoles == null) {
                settings.exemptRoles = [];
            }

            if (settings.bannedWordList == null) {
                settings.bannedWordList = {
                    enabled: false,
                    exemptRoles: [],
                    max: 10
                };
            }

            if (settings.bannedWordList.exemptRoles == null) {
                settings.bannedWordList.exemptRoles = [];
            }

            if (settings.emoteLimit == null) {
                settings.emoteLimit = {
                    enabled: false,
                    exemptRoles: [],
                    max: 10
                };
            }

            if (settings.emoteLimit.exemptRoles == null) {
                settings.emoteLimit.exemptRoles = [];
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

        let words = getBannedWordsDb().getData("/");
        if (words && Object.keys(words).length > 0) {
            bannedWords = words;
        }

        let regularExpressions = getbannedRegularExpressionsDb().getData("/");
        if (regularExpressions && Object.keys(regularExpressions).length > 0) {
            bannedRegularExpressions = regularExpressions;
        }
    } catch (error) {
        if (error.name === 'DatabaseError') {
            logger.error("Error loading chat moderation data", error);
        }
    }
    logger.info("Attempting to setup chat moderation worker...");
    startModerationService();
}
exports.load = load;
exports.stopService = stopService;
exports.moderateMessage = moderateMessage;
exports.getChatModerationSettings = getChatModerationSettings;