"use strict";

const logger = require("../../logwrapper");

const messageCache = [];
const chatCacheLimit = 50;

let raidMessage = "";
let checkerEnabled = false;
const settings = {
    shouldBan: false,
    shouldBlock: false
};

async function handleRaider(message) {
    const twitchApi = require("../../twitch-api/api");

    if (settings.shouldBan) {
        await twitchApi.moderation.banUser(message.username);
    }

    if (settings.shouldBlock) {
        await twitchApi.users.blockUser(message.userId);
    }
}

/**
 *
 * @param {import("../chat-helpers").FirebotChatMessage} firebotChatMessage
 */
function sendMessageToCache(firebotChatMessage) {
    if (messageCache.length >= chatCacheLimit) {
        messageCache.shift();
    }

    if (firebotChatMessage.rawText.length > 10) {
        firebotChatMessage.rawText = firebotChatMessage.rawText.substr(10);
    }

    messageCache.push(firebotChatMessage);

    if (firebotChatMessage && checkerEnabled && firebotChatMessage.rawText === raidMessage) {
        handleRaider(firebotChatMessage);
    }
}

function getRaidMessage() {
    const rawMessages = messageCache.map(message => message.rawText);
    const raidMessages = rawMessages.reduce((allMessages, message) => {
        if (allMessages[message] != null) {
            allMessages[message] += 1;
        } else {
            allMessages[message] = 1;
        }

        return allMessages;
    }, {});

    const highest = Math.max(...Object.values(raidMessages));
    const index = Object.values(raidMessages).findIndex(message => message === highest);

    return Object.keys(raidMessages)[index];
}

function checkPreviousMessages() {
    for (const message in messageCache) {
        if (messageCache[message].rawText === raidMessage) {
            handleRaider(messageCache[message]);
        }
    }
}

function enable(shouldBan, shouldBlock) {
    raidMessage = getRaidMessage();
    settings.shouldBan = shouldBan;
    settings.shouldBlock = shouldBlock;

    checkPreviousMessages();

    checkerEnabled = true;
    logger.debug("Raid message checker enabled...");
}

function disable() {
    checkerEnabled = false;
}

exports.sendMessageToCache = sendMessageToCache;
exports.enable = enable;
exports.disable = disable;