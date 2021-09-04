/* eslint-disable no-warning-comments */
"use strict";

const twitchApi = require('../twitch-api/client');
const deepmerge = require("deepmerge");

// Holds an updating model of the streamers channel data.
let streamerChannelData;

exports.refreshStreamerChannelData = async () => {
    const client = twitchApi.getClient();
    if (client == null) {
        return;
    }

    let channel = await client.kraken.channels.getMyChannel();
    let channelData = channel._data;
    let streamData = await channel.getStream();
    channelData.stream = streamData;

    streamerChannelData = channelData;
};

exports.updateStreamerChannelData = async (newData) => {
    if (streamerChannelData == null) {
        await this.refreshStreamerChannelData();
    }

    streamerChannelData = deepmerge(streamerChannelData, newData);
    return streamerChannelData;
};

exports.getStreamerChannelData = async () => {
    if (streamerChannelData == null) {
        await this.refreshStreamerChannelData();
    }

    return streamerChannelData;
};