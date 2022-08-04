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
    } catch (error) {
        logger.error("Failed to get global ffz emotes", error);
    }

    let channelEmotes = [];
    try {
        channelEmotes = (await axios.get(getChannelEmotesUrl())).data;
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

