"use strict";
const logger = require("../../logwrapper");
const profileManager = require("../../common/profile-manager");
const { Worker } = require("worker_threads");
const chat = require("../../common/mixer-chat");
const frontendCommunicator = require("../../common/frontend-communicator");
const rolesManager = require("../../roles/custom-roles-manager");
const path = require("path");
const callsites = require("callsites");

function rebaseScriptPath(scriptPath, ignoreRegex) {
    const parentCallSite = callsites().find((callsite) => {
        const filename = callsite.getFileName();
        return Boolean(filename && !filename.match(ignoreRegex) && !filename.match(/[\/\\]master[\/\\]implementation/)); // eslint-disable-line no-useless-escape
    });

    const callerPath = parentCallSite ? parentCallSite.getFileName() : null;
    const rebasedScriptPath = callerPath ? path.join(path.dirname(callerPath), scriptPath) : scriptPath;

    return rebasedScriptPath;
}

function resolveScriptPath(scriptPath) {

    let workerFilePath = require.resolve(rebaseScriptPath(scriptPath, /[\/\\]worker_threads[\/\\]/)); // eslint-disable-line no-useless-escape

    return workerFilePath;
}

let getChatModerationSettingsDb = () => profileManager.getJsonDbInProfile("/chat/moderation/chat-moderation-settings");
let getBannedWordsDb = () => profileManager.getJsonDbInProfile("/chat/moderation/banned-words", false);

// default settings
let chatModerationSettings = {
    bannedWordList: {
        enabled: false,
        exemptRoles: []
    }
};

let bannedWords = {
    words: []
};

function getBannedWordsList() {
    if (!bannedWords || !bannedWords.words) return [];
    return bannedWords.words.map(w => w.text);
}

/**
 * @type Worker
 */
let moderationService = null;

function startModerationService() {
    if (moderationService != null) return;

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
                chat.deleteChat(event.messageId);
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
}

function stopService() {
    if (moderationService != null) {
        moderationService.terminate();
        moderationService.unref();
        moderationService = null;
    }
}

function getMessageText(chatMessage) {
    if (!chatMessage.message || !chatMessage.message.message) {
        return null;
    }
    return chatMessage.message.message
        .filter(ms => ms.type === "text")
        .map(ms => ms.text)
        .join("");
}

function moderateMessage(chatMessage) {
    if (chatMessage == null) return;

    let moderateMessage = false;

    // catbot already got it
    if (chatMessage.message.meta.censored) {
        return;
    }

    if (chatModerationSettings.bannedWordList.enabled) {
        let username = chatMessage.user_name;
        let mixerRoles = chatMessage.user_roles;
        let userExempt = rolesManager.userIsInRole(username, mixerRoles,
            chatModerationSettings.bannedWordList.exemptRoles);

        if (!userExempt) {
            moderateMessage = true;
        }
    }

    if (moderateMessage) {
        let message = getMessageText(chatMessage);
        let messageId = chatMessage.id;
        moderationService.postMessage(
            {
                type: "moderateMessage",
                message: message,
                messageId: messageId,
                scanForBannedWords: chatModerationSettings.bannedWordList.enabled
            }
        );
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

frontendCommunicator.on("getChatModerationData", () => {
    return {
        settings: chatModerationSettings,
        bannedWords: bannedWords.words
    };
});

function load() {
    try {
        let settings = getChatModerationSettingsDb().getData("/");
        if (settings && Object.keys(settings).length > 0) {
            chatModerationSettings = settings;
        }

        let words = getBannedWordsDb().getData("/");
        if (words && Object.keys(words).length > 0) {
            bannedWords = words;
        }
    } catch (error) {
        if (error.name === 'DatabaseError') {
            logger.error("Error loading chat moderation data", error);
        }
    }
    startModerationService();
}
exports.load = load;
exports.stopService = stopService;
exports.moderateMessage = moderateMessage;