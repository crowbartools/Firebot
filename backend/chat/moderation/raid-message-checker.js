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

function handleRaider(message) {
    const chat = require("../twitch-chat");

    if (settings.shouldBan) {
        chat.ban(message.username, "");
    }

    if (settings.shouldBlock) {
        chat.block(message.userId, "");
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

    const counts = Object.values(raidMessages);

    const highest = Math.max(...counts);
    if (highest < 2) {
        return "";
    }

    const index = counts.findIndex(count => count === highest);

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

    if (!raidMessage) {
        logger.debug("No raid message detected");
        return;
    }

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