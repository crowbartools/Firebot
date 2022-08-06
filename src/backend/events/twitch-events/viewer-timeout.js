"use strict";

const eventManager = require("../EventManager");

/** @param {import("@twurple/pubsub").PubSubChatModActionMessage} message */
exports.triggerTimeout = (message) => {
    eventManager.triggerEvent("twitch", "timeout", {
        username: message.args[0],
        timeoutDuration: message.args[1],
        moderator: message.userName,
        modReason: message.args[2] || ""
    });
};