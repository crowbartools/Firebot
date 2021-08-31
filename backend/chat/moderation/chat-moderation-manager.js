"use strict";
const logger = require("../../logwrapper");
const profileManager = require("../../common/profile-manager");
const frontendCommunicator = require("../../common/frontend-communicator");
const rolesManager = require("../../roles/custom-roles-manager");
const permitCommand = require("./features/url-moderation/url-permit-command");
const moderationFeatures = require("./moderation-features");

let getChatModerationSettingsDb = () => profileManager.getJsonDbInProfile("/chat/moderation/chat-moderation-settings");

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
            moderationFeatures.emoteLimit.moderate(chatMessage, chatModerationSettings.emoteLimit, (moderated) => {
                if (moderated) {
                    messageModerated = true;
                }
            });
        }

        if (!messageModerated && chatModerationSettings.urlModeration.enabled) {
            moderationFeatures.urls.moderate(chatMessage, chatModerationSettings.urlModeration, (moderated) => {
                if (moderated) {
                    messageModerated = true;
                }
            });
        }

        if (!messageModerated && chatModerationSettings.bannedWordList.enabled) {
            moderationFeatures.bannedWordList.moderate(chatMessage, chatModerationSettings.bannedWordList, (moderated) => {
                if (moderated) {
                    messageModerated = true;
                }
            });
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

frontendCommunicator.on("getChatModerationData", () => {
    return {
        settings: chatModerationSettings,
        bannedWords: moderationFeatures.bannedWordList.getBannedWordsList(),
        bannedRegularExpressions: moderationFeatures.bannedWordList.getBannedRegularExpressions()
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

        moderationFeatures.bannedWordList.load();
    } catch (error) {
        if (error.name === 'DatabaseError') {
            logger.error("Error loading chat moderation data", error);
        }
    }
    logger.info("Attempting to setup chat moderation worker...");
}
exports.load = load;
exports.moderateMessage = moderateMessage;