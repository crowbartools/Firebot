"use strict";

const logger = require("../../../logwrapper");
const eventManager = require("../../EventManager");
const frontendCommunicator = require("../../../common/frontend-communicator");

module.exports = {
    event: "channel:{streamerChannelId}:adBreak",
    callback: (data) => {
        logger.debug("adBreak Event");
        logger.debug(data);

        eventManager.triggerEvent("mixer", "ad-break", {
            username: "UnknownUser",
            maxAdBreakLengthInSec: data.maxAdBreakLengthInSec
        });

        frontendCommunicator.send("chat-feed-system-message", `An ad-break has been started! (Max ad length: ${data.maxAdBreakLengthInSec} secs)`);
    }
};