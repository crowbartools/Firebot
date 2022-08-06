"use strict";

const eventManager = require("../EventManager");

/** @param {import("@twurple/pubsub").PubSubChatModActionMessage} message */
exports.triggerChatModeChanged = (message) => {
    eventManager.triggerEvent("twitch", "chat-mode-changed", {
        chatMode: message.action,
        chatModeState: message.action.includes("off") ? "disabled" : "enabled",
        moderator: message.userName,
        duration: message.args ? parseInt(message.args[0]) : null
    });
};