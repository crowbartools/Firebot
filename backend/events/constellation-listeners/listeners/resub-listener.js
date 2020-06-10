"use strict";

const eventManager = require("../../../events/EventManager");

module.exports = {
    event: "channel:{streamerChannelId}:resubscribed",
    callback: (data) => {
        eventManager.triggerEvent("mixer", "resub", {
            shared: false,
            username: data.user.username,
            userId: data.user.id,
            totalMonths: data.totalMonths,
            currentStreak: -1
        });
    }
};