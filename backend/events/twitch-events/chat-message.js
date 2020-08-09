"use strict";

const eventManager = require("../../events/EventManager");

/**
 * @arg {import('../../chat/chat-helpers').FirebotChatMessage} firebotChatMessage
 */
exports.triggerChatMessage = (firebotChatMessage) => {
    eventManager.triggerEvent("twitch", "chat-message", {
        username: firebotChatMessage.username,
        twitchUserRoles: firebotChatMessage.roles,
        messageText: firebotChatMessage.rawText,
        chatMessage: firebotChatMessage
    });
};