"use strict";

const logger = require("../../logwrapper");

let messageCache = [];
let chatCacheLimit = 50;

let raidMessage = "";
let checkerEnabled = false;
let settings = {
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

function sendMessageToCache(firebotChatMessage) {
    if (messageCache.length >= chatCacheLimit) {
        messageCache.shift();
    }

    messageCache.push(firebotChatMessage);

    if (firebotChatMessage && checkerEnabled && firebotChatMessage.rawText === raidMessage) {
        handleRaider(firebotChatMessage);
    }
}

function getRaidMessage() {
    let rawMessages = messageCache.map(message => message.rawText);
    let raidMessages = rawMessages.reduce(function (allMessages, message) {
        if (message in allMessages) {
            allMessages[message]++;
        } else {
            allMessages[message] = 1;
        }

        return allMessages;
    }, {});

    let highest = Math.max(...Object.values(raidMessages));
    let index = Object.values(raidMessages).findIndex(message => message === highest);

    return Object.keys(raidMessages)[index];
}

function checkPreviousMessages() {
    for (let message in messageCache) {
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