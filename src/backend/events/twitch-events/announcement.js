"use strict";

const eventManager = require("../EventManager");

/**
 * @arg {import('../../chat/chat-helpers').FirebotChatMessage} firebotChatMessage
 */
exports.triggerAnnouncement = (firebotChatMessage) => {
    eventManager.triggerEvent("twitch", "announcement", {
        useridname: firebotChatMessage.useridname,
        username: firebotChatMessage.username,
        twitchUserRoles: firebotChatMessage.roles,
        messageText: firebotChatMessage.rawText
    });
};