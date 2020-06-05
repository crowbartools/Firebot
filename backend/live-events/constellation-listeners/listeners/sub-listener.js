"use strict";

const eventManager = require("../../../live-events/EventManager");

module.exports = {
    event: "channel:{streamerChannelId}:subscribed",
    callback: (data) => {
        eventManager.triggerEvent("mixer", "subscribed", {
            username: data.user.username,
            userId: data.user.id,
            totalMonths: 0
        });
    }
};