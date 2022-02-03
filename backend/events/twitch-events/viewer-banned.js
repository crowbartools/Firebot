"use strict";

const eventManager = require("../EventManager");

/** @param {import("@twurple/pubsub").PubSubChatModActionMessage} message */
exports.triggerBanned = (message) => {
    eventManager.triggerEvent("twitch", "banned", {
        username: message.args[0],
        moderator: message.userName,
        modReason: message.args[1] || ""
    });
};