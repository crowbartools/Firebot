"use strict";
const logger = require("../../logwrapper");
const profileManager = require("../../common/profile-manager");
const { Worker } = require("worker_threads");
const frontendCommunicator = require("../../common/frontend-communicator");
const rolesManager = require("../../roles/custom-roles-manager");
const permitCommand = require("./features/url-moderation/url-permit-command");
const moderationFeatures = require("./moderation-features");

let getChatModerationSettingsDb = () => profileManager.getJsonDbInProfile("/chat/moderation/chat-moderation-settings");
let getBannedWordsDb = () => profileManager.getJsonDbInProfile("/chat/moderation/banned-words", false);
let getbannedRegularExpressionsDb = () => profileManager.getJsonDbInProfile("/chat/moderation/banned-regular-expressions", false);

// default settings
let chatModerationSettings = {
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
        let messageModerated = false;

        if (chatModerationSettings.emoteLimit.enabled && !!chatModerationSettings.emoteLimit.max) {
            const userExempt = rolesManager.userIsInRole(chatMessage.username, chatMessage.roles,
                chatModerationSettings.emoteLimit.exemptRoles);

            if (!userExempt) {
                moderationFeatures.emoteLimit.moderate(chatMessage, chatModerationSettings.emoteLimit, (moderated) => {
                    if (moderated) {
                        messageModerated = true;
                    }
                });
            }
        }

        if (!messageModerated && chatModerationSettings.urlModeration.enabled) {
            const userExempt = rolesManager.userIsInRole(chatMessage.username, chatMessage.roles,
                chatModerationSettings.urlModeration.exemptRoles);

            if (!userExempt) {
                moderationFeatures.urls.moderate(chatMessage, chatModerationSettings.urlModeration, (moderated) => {
                    if (moderated) {
                        messageModerated = true;
                    }
                });
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

frontendCommunicator.on("chatMessageSettingsUpdate", settings => {
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