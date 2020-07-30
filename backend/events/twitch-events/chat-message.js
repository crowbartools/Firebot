"use strict";

const eventManager = require("../../events/EventManager");

exports.triggerChatMessage = (username, userRoles, message = "") => {
    eventManager.triggerEvent("twitch", "chat-message", {
        username: username,
        twitchUserRoles: userRoles,
        messageText: message
    });
};