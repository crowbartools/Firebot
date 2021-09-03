"use strict";
const logger = require("../../logwrapper");
const profileManager = require("../../common/profile-manager");
const { Worker } = require("worker_threads");
const frontendCommunicator = require("../../common/frontend-communicator");
const rolesManager = require("../../roles/custom-roles-manager");
const permitCommand = require("./url-permit-command");

const getChatModerationSettingsDb = () => profileManager.getJsonDbInProfile("/chat/moderation/chat-moderation-settings");
const getBannedWordsDb = () => profileManager.getJsonDbInProfile("/chat/moderation/banned-words", false);
const getbannedRegularExpressionsDb = () => profileManager.getJsonDbInProfile("/chat/moderation/banned-regular-expressions", false);

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

const getBannedWordsList = () => {
    if (!bannedWords || !bannedWords.words) return [];
    return bannedWords.words.map(w => w.text);
};

const getBannedRegularExpressionsList = () => {
    if (!bannedRegularExpressions || !bannedRegularExpressions.regularExpressions) return [];
    return bannedRegularExpressions.regularExpressions.map(r => r.text);
};

/**
 * @type Worker
 */
let moderationService = null;

const startModerationService = () => {
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

            if (event.outputMessage) {
                chat.sendChatMessage(event.outputMessage);
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
};

const stopService = () => {
    if (moderationService != null) {
        moderationService.terminate();
        moderationService.unref();
        moderationService = null;
    }
};

/**
 *
 * @param {import("../chat-helpers").FirebotChatMessage} chatMessage
 */
const moderateMessage = async (chatMessage) => {
    if (chatMessage == null) return;

    if (
        !chatModerationSettings.bannedWordList.enabled
        && !chatModerationSettings.emoteLimit.enabled
        && !chatModerationSettings.urlModeration.enabled
    ) return;

    const globalUserExempt = rolesManager.userIsInRole(chatMessage.username, chatMessage.roles,
        chatModerationSettings.exemptRoles);

    if (!globalUserExempt) {
        if (chatModerationSettings.bannedWordList.enabled) {
            const userExempt = rolesManager.userIsInRole(chatMessage.username, chatMessage.roles,
                chatModerationSettings.bannedWordList.exemptRoles);

            if (!userExempt) {
                const message = chatMessage.rawText;
                const messageId = chatMessage.id;

                moderationService.postMessage(
                    {
                        type: "moderateBannedWords",
                        message: message,
                        messageId: messageId
                    }
                );
            }
        }

        if (chatModerationSettings.emoteLimit.enabled && !!chatModerationSettings.emoteLimit.max) {
            const userExempt = rolesManager.userIsInRole(chatMessage.username, chatMessage.roles,
                chatModerationSettings.emoteLimit.exemptRoles);

            if (!userExempt) {
                moderationService.postMessage(
                    {
                        type: "moderateEmoteLimit",
                        chatMessage: chatMessage,
                        emoteMax: chatModerationSettings.emoteLimit.max
                    }
                );
            }
        }

        if (chatModerationSettings.urlModeration.enabled) {
            if (!permitCommand.hasTemporaryPermission(chatMessage.username)) {
                const userExempt = rolesManager.userIsInRole(chatMessage.username, chatMessage.roles,
                    chatModerationSettings.urlModeration.exemptRoles);

                if (!userExempt) {
                    let viewer = {};

                    if (chatModerationSettings.urlModeration.viewTime && chatModerationSettings.urlModeration.viewTime.enabled) {
                        const viewerDB = require('../../database/userDatabase');
                        viewer = await viewerDB.getUserByUsername(chatMessage.username);
                    }

                    moderationService.postMessage(
                        {
                            type: "moderateUrls",
                            chatMessage: chatMessage,
                            viewer: viewer,
                            settings: chatModerationSettings.urlModeration
                        }
                    );
                }
            }
        }
    }
};

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

const saveBannedWordList = () => {
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
};

const saveBannedRegularExpressionsList = () => {
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
};

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

frontendCommunicator.on("addBannedRegularExpression", regularExpressions => {
    bannedRegularExpressions.regularExpressions = bannedRegularExpressions.regularExpressions.concat(regularExpressions);
    saveBannedRegularExpressionsList();
});

frontendCommunicator.on("removeBannedRegularExpression", regexText => {
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

const load = () => {
    try {
        const settings = getChatModerationSettingsDb().getData("/");
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

        const words = getBannedWordsDb().getData("/");
        if (words && Object.keys(words).length > 0) {
            bannedWords = words;
        }

        const regularExpressions = getbannedRegularExpressionsDb().getData("/");
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
};

exports.load = load;
exports.stopService = stopService;
exports.moderateMessage = moderateMessage;