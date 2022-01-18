"use strict";

const eventManager = require("../EventManager");

/** @param {import("@twurple/pubsub").PubSubChatModActionMessage} message */
exports.triggerChatModeChanged = (message) => {
    eventManager.triggerEvent("twitch", "chat-mode-changed", {
        chatMode: message.action,
        moderator: message.userName,
        duration: message.args ? parseInt(message.args[0]) : null
    });
};