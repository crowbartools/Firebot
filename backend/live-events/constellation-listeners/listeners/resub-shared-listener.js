"use strict";

const eventManager = require("../../../live-events/EventManager");

module.exports = {
    event: "channel:{streamerChannelId}:resubShared",
    callback: (data) => {
        eventManager.triggerEvent("mixer", "resub", {
            shared: true,
            username: data.user.username,
            userId: data.user.id,
            totalMonths: data.totalMonths,
            currentStreak: data.currentStreak
        });
    }
};