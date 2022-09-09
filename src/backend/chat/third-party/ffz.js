"use strict";

const axios = require("axios").default;
const accountAccess = require("../../common/account-access");
const logger = require("../../logwrapper");

const GLOBAL_EMOTES_URL = "https://api.betterttv.net/3/cached/frankerfacez/emotes/global";

const getChannelEmotesUrl = () => `https://api.betterttv.net/3/cached/frankerfacez/users/twitch/${accountAccess.getAccounts().streamer.userId}`;

exports.getAllFfzEmotes = async () => {
    let globalEmotes = [];
    try {
        globalEmotes = (await axios.get(GLOBAL_EMOTES_URL)).data;

        if (!Array.isArray(globalEmotes)) {
            logger.warn(`Invalid global FFZ emote response: ${JSON.stringify(globalEmotes)}`);
            globalEmotes = [];
        }
    } catch (error) {
        logger.error("Failed to get global ffz emotes", error);
    }

    let channelEmotes = [];
    try {
        channelEmotes = (await axios.get(getChannelEmotesUrl())).data;

        if (!Array.isArray(channelEmotes)) {
            logger.warn(`Invalid channel FFZ emote response: ${JSON.stringify(channelEmotes)}`);
            channelEmotes = [];
        }
    } catch (error) {
        logger.error("Failed to get channel ffz emotes", error);
    }

    return [
        ...globalEmotes,
        ...channelEmotes
    ].map(e => ({
        url: e.images && e.images["1x"],
        code: e.code,
        origin: "FFZ",
        animated: e.imageType && e.imageType.toLowerCase() === "gif"
    }));
};

