"use strict";
const logger = require("../../logwrapper");
const profileManager = require("../../common/profile-manager");
const { Worker } = require("worker_threads");
const frontendCommunicator = require("../../common/frontend-communicator");
const rolesManager = require("../../roles/custom-roles-manager");
const permitCommand = require("./url-permit-command");
const utils = require("../../utility");

const getChatModerationSettingsDb = () => profileManager.getJsonDbInProfile("/chat/moderation/chat-moderation-settings");
const getBannedWordsDb = () => profileManager.getJsonDbInProfile("/chat/moderation/banned-words", false);
const getbannedRegularExpressionsDb = () => profileManager.getJsonDbInProfile("/chat/moderation/banned-regular-expressions", false);
const getUrlAllowlistDb = () => profileManager.getJsonDbInProfile("/chat/moderation/url-allowlist", false);

// default settings
let chatModerationSettings = {
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

let bannedWords = {
    words: []
};

let bannedRegularExpressions = {
    regularExpressions: []
};

let urlAllowlist = {
    urls: []
};

function getBannedWordsList() {
    if (!bannedWords || !bannedWords.words) {
        return [];
    }
    return bannedWords.words.map(w => w.text);
}

function getBannedRegularExpressionsList() {
    if (!bannedRegularExpressions || !bannedRegularExpressions.regularExpressions) {
        return [];
    }
    return bannedRegularExpressions.regularExpressions.map(r => r.text);
}

function getUrlAllowlist() {
    if (!urlAllowlist || !urlAllowlist.urls) {
        return [];
    }
    return urlAllowlist.urls.map(u => u.text);
}

/**
 * @type Worker
 */
let moderationService = null;

function startModerationService() {
    if (moderationService != null) {
        return;
    }

    const chat = require("../twitch-chat");

    let servicePath = require("path").resolve(__dirname, "./moderation-service.js");

    if (servicePath.includes("app.asar")) {
        servicePath = servicePath.replace('app.asar', 'app.asar.unpacked');
    }

    moderationService = new Worker(servicePath);

    moderationService.on("message", event => {
        if (event == null) {
            return;
        }
        switch (event.type) {
        case "deleteMessage": {
            if (event.messageId) {
                logger.debug(event.logMessage);
                chat.deleteMessage(event.messageId);

                let outputMessage = chatModerationSettings.bannedWordList.outputMessage || "";
                if (outputMessage) {
                    outputMessage = outputMessage.replace("{userName}", event.username);
                    chat.sendChatMessage(outputMessage);
                }
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
    const re = /\p{Extended_Pictographic}/ug;
    return ((str || '').match(re) || []).length;
};

/**
 *
 * @param {import("../chat-helpers").FirebotChatMessage} chatMessage
 */
async function moderateMessage(chatMessage) {
    if (chatMessage == null) {
        return;
    }

    if (
        !chatModerationSettings.bannedWordList.enabled
        && !chatModerationSettings.emoteLimit.enabled
        && !chatModerationSettings.urlModeration.enabled
    ) {
        return;
    }

    const userExemptGlobally = rolesManager.userIsInRole(chatMessage.username, chatMessage.roles,
        chatModerationSettings.exemptRoles);

    if (userExemptGlobally) {
        return;
    }

    const chat = require("../twitch-chat");

    const userExemptForEmoteLimit = rolesManager.userIsInRole(chatMessage.username, chatMessage.roles, chatModerationSettings.emoteLimit.exemptRoles);
    if (chatModerationSettings.emoteLimit.enabled && !!chatModerationSettings.emoteLimit.max && !userExemptForEmoteLimit) {
        const emoteCount = chatMessage.parts.filter(p => p.type === "emote").length;
        const emojiCount = chatMessage.parts
            .filter(p => p.type === "text")
            .reduce((acc, part) => acc + countEmojis(part.text), 0);
        if ((emoteCount + emojiCount) > chatModerationSettings.emoteLimit.max) {
            chat.deleteMessage(chatMessage.id);

            let outputMessage = chatModerationSettings.emoteLimit.outputMessage || "";
            if (outputMessage) {
                outputMessage = outputMessage.replace("{userName}", chatMessage.username);
                chat.sendChatMessage(outputMessage);
            }

            return;
        }
    }

    const userExemptForUrlModeration = rolesManager.userIsInRole(chatMessage.username, chatMessage.roles, chatModerationSettings.urlModeration.exemptRoles);
    if (chatModerationSettings.urlModeration.enabled && !userExemptForUrlModeration && !permitCommand.hasTemporaryPermission(chatMessage.username)) {
        let shouldDeleteMessage = false;
        const message = chatMessage.rawText;
        const regex = utils.getUrlRegex();

        if (regex.test(message)) {
            logger.debug("Url moderation: Found url in message...");

            const settings = chatModerationSettings.urlModeration;
            let outputMessage = settings.outputMessage || "";

            let disallowedUrlFound = false;

            // If the urlAllowlist is empty, ANY URL is disallowed
            if (urlAllowlist.length === 0) {
                disallowedUrlFound = true;
            } else {
                const urlsFound = message.match(regex);

                // Go through the list of URLs found in the message...
                for (let url of urlsFound) {
                    url = url.toLowerCase();

                    // And see if there's a matching rule in the allow list
                    const foundAllowlistRule = getUrlAllowlist().find(allowedUrl => url.includes(allowedUrl.toLowerCase()));

                    // If there isn't, we have at least one bad URL, so we flag the message and dip out
                    if (!foundAllowlistRule) {
                        disallowedUrlFound = true;
                        break;
                    }
                }
            }

            if (disallowedUrlFound) {
                if (settings.viewTime && settings.viewTime.enabled) {
                    const viewerDB = require('../../database/userDatabase');
                    const viewer = await viewerDB.getUserByUsername(chatMessage.username);

                    const viewerViewTime = viewer.minutesInChannel / 60;
                    const minimumViewTime = settings.viewTime.viewTimeInHours;

                    if (viewerViewTime <= minimumViewTime) {
                        outputMessage = outputMessage.replace("{viewTime}", minimumViewTime.toString());

                        logger.debug("Url moderation: Not enough view time.");
                        shouldDeleteMessage = true;
                    }
                } else {
                    shouldDeleteMessage = true;
                }

                if (shouldDeleteMessage) {
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

    const message = chatMessage.rawText;
    const messageId = chatMessage.id;
    const username = chatMessage.username;
    moderationService.postMessage(
        {
            type: "moderateMessage",
            message: message,
            messageId: messageId,
            username: username,
            scanForBannedWords: chatModerationSettings.bannedWordList.enabled,
            isExempt: rolesManager.userIsInRole(chatMessage.username, chatMessage.roles, chatModerationSettings.bannedWordList.exemptRoles),
            maxEmotes: null
        }
    );
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

function saveUrlAllowlist() {
    try {
        getUrlAllowlistDb().push("/", urlAllowlist);
    } catch (error) {
        if (error.name === 'DatabaseError') {
            logger.error("Error saving URL allowlist data", error);
        }
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

frontendCommunicator.on("addAllowedUrls", words => {
    urlAllowlist.urls = urlAllowlist.urls.concat(words);
    saveUrlAllowlist();
});

frontendCommunicator.on("removeAllowedUrl", wordText => {
    urlAllowlist.urls = urlAllowlist.urls.filter(u => u.text.toLowerCase() !== wordText);
    saveUrlAllowlist();
});

frontendCommunicator.on("removeAllAllowedUrls", () => {
    urlAllowlist.urls = [];
    saveUrlAllowlist();
});

frontendCommunicator.on("getChatModerationData", () => {
    return {
        settings: chatModerationSettings,
        bannedWords: bannedWords.words,
        bannedRegularExpressions: bannedRegularExpressions.regularExpressions,
        urlAllowlist: urlAllowlist.urls
    };
});

function load() {
    try {
        const settings = getChatModerationSettingsDb().getData("/");
        if (settings && Object.keys(settings).length > 0) {
            chatModerationSettings = settings;
            if (settings.exemptRoles == null) {
                settings.exemptRoles = [];
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

        const allowlist = getUrlAllowlistDb().getData("/");
        if (allowlist && Object.keys(allowlist).length > 0) {
            urlAllowlist = allowlist;
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