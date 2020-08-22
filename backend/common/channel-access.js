/* eslint-disable no-warning-comments */
"use strict";

const logger = require('../logwrapper');
const accountAccess = require("../common/account-access");
const twitchApi = require('../twitch-api/client');
const twitchChat = require('../chat/twitch-chat');
const deepmerge = require("deepmerge");
const uuidv4 = require("uuid/v4");
const NodeCache = require("node-cache");
let linkHeaderParser = require('parse-link-header');

// Holds an updating model of the streamers channel data.
/**@type {import('../mixer-api/resource/channels').MixerChannelSimple} */
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