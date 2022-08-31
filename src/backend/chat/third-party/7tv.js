"use strict";

const axios = require("axios").default;
const accountAccess = require("../../common/account-access");
const logger = require("../../logwrapper");

const GLOBAL_EMOTES_URL = "https://api.7tv.app/v2/emotes/global";

const getChannelEmotesUrl = () => `https://api.7tv.app/v2/users/${accountAccess.getAccounts().streamer.userId}/emotes`;


exports.getAllSevenTvEmotes = async () => {
    let globalEmotes = [];
    try {
        globalEmotes = (await axios.get(GLOBAL_EMOTES_URL)).data;

        if (!Array.isArray(globalEmotes)) {
            logger.warn(`Invalid global 7TV emote response: ${JSON.stringify(globalEmotes)}`);
            globalEmotes = [];
        }
    } catch (error) {
        logger.error("Failed to get global 7TV emotes", error.message);
    }

    let channelEmotes = [];
    try {
        channelEmotes = (await axios.get(getChannelEmotesUrl())).data;

        if (!Array.isArray(channelEmotes)) {
            logger.warn(`Invalid channel 7TV emote response: ${JSON.stringify(channelEmotes)}`);
            channelEmotes = [];
        }
    } catch (error) {
        logger.error("Failed to get channel 7TV emotes:", error.message);
    }

    return [
        ...globalEmotes,
        ...channelEmotes
    ].map(e => ({
        url: e.urls[0][1],
        code: e.name,
        origin: "7TV",
        animated: e.mime && e.mime.toLowerCase() === "image/gif"
    }));
};

