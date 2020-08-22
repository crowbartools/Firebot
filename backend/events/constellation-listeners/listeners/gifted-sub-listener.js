"use strict";

const eventManager = require("../../../events/EventManager");

module.exports = {
    event: "channel:{streamerChannelId}:subscriptionGifted",
    callback: (data) => {
        eventManager.triggerEvent("mixer", "subscription-gifted", {
            username: data.gifterUsername,
            gifterUser: data.gifterUsername,
            giftReceiverUser: data.giftReceiverUsername
        });
    }
};