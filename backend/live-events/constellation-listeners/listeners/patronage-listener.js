"use strict";

const logger = require("../../../logwrapper");
const patronageManager = require("../../../patronageManager");

module.exports = {
    event: "channel:{streamerChannelId}:patronageUpdate",
    callback: (data) => {
        logger.debug("patronageUpdate Event");
        logger.debug(data);

        patronageManager.setChannelPatronageData(data);
    }
};