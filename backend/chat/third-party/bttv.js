"use strict";

const axios = require("axios").default;
const accountAccess = require("../../common/account-access");
const logger = require("../../logwrapper");

const GLOBAL_EMOTES_URL = "https://api.betterttv.net/3/cached/emotes/global";

const getChannelEmotesUrl = () => `https://api.betterttv.net/3/cached/users/twitch/${accountAccess.getAccounts().streamer.userId}`;


exports.getAllBttvEmotes = async () => {
    let globalEmotes = [];
    try {
        globalEmotes = (await axios.get(GLOBAL_EMOTES_URL)).data;
    } catch (error) {
        logger.error("Failed to get global bttv emotes", error.message);
    }

    let channelEmotes = [];
    try {
        const channelEmoteData = (await axios.get(getChannelEmotesUrl())).data;
        channelEmotes = [
            ...channelEmoteData.channelEmotes,
            ...channelEmoteData.sharedEmotes
        ];
    } catch (error) {
        logger.error("Failed to get channel bttv emotes:", error.message);
    }

    return [
        ...globalEmotes,
        ...channelEmotes
    ].map(e => ({
        url: `https://cdn.betterttv.net/emote/${e.id}/1x`,
        code: e.code,
        origin: "BTTV",
        animated: e.imageType && e.imageType.toLowerCase() === "gif"
    }));
};

