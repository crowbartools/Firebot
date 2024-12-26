"use strict";

exports.openUrl = async (event, url) => {
    const logger = require("../../../logwrapper");
    const frontendCommunicator = require("../../../common/frontend-communicator");
    const TwitchApi = require("../../../twitch-api/api");

    url = url.toLowerCase();
    logger.debug(`Received Firebot URL request: ${url}`);

    if (url.startsWith("firebot://")) {
        url = url.substring(10);
    }

    const urlParams = url.split("/");

    switch (urlParams[0]) {
        case "viewer-card":
            logger.debug("Received Firebot URL request to load viewer card");

            switch (urlParams[1]) {
                case "id":
                    logger.debug(`Opening viewer card for user ID ${urlParams[2]}`);
                    frontendCommunicator.send("showViewerCard", urlParams[2]);
                    break;

                case "name":
                    logger.debug(`Opening viewer card for username ${urlParams[2]}`);
                    frontendCommunicator.send("showViewerCard", (await TwitchApi.users.getUserByName(urlParams[2]))?.id);
                    break;

                default:
                    logger.debug(`Invalid viewer card method specified (${urlParams[1]})`);
            }
            break;

        case "dashboard":
        case "commands":
        case "events":
        case "time-based":
        case "channel-rewards":
        case "preset-effect-lists":
        case "hotkeys":
        case "counters":
            frontendCommunicator.send("navigate", urlParams[0]);
            break;

        default:
            logger.debug("No matching URL commands found");
            break;
    }
};