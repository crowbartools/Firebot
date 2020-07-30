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

exports.getStreamerSubBadge = async () => {
    // TODO: For Twitch this should return an array of sub badges?
    return null;
};

exports.getStreamerOnlineStatus = async () => {
    await this.refreshStreamerChannelData();

    if (streamerChannelData.stream == null) {
        return false;
    }

    return true;
};

exports.getStreamerAudience = async () => {
    //TODO: Audience means something else on twitch.
    return null;
};

exports.setStreamerAudience = async (audience) => {
    //TODO: Audience means something else on twitch.
};

exports.getStreamerGameData = async () => {
    if (streamerChannelData.game == null) {
        return null;
    }

    return streamerChannelData.game;
};

exports.setStreamGameById = async typeId => {
    await twitchApi.channels.updateChannelInformation(undefined, typeId);
};

exports.setStreamGameByName = async typeNameQuery => {
    const categories = await twitchApi.categories.searchCategories(typeNameQuery);
    if (categories && categories.length > 0) {
        await twitchApi.channels.updateChannelInformation(undefined, categories[0].id);
    }
};

exports.setStreamTitle = async newTitle => {
    const { TwitchAPICallType } = require('twitch/lib');
    const client = twitchApi.getClient();

    await client.callAPI({
        type: TwitchAPICallType.Helix,
        method: "PATCH",
        url: "channels",
        query: {
            "broadcaster_id": accountAccess.getAccounts().streamer.userId,
            "title": newTitle
        }
    });
};

const viewerRoleCache = new NodeCache({ stdTTL: 10, checkperiod: 10 });

exports.getViewersMixerRoles = async username => {
    return [];
};

exports.getChatUser = async userId => {
    const client = twitchApi.getClient();
    let user = client.kraken.users.getUser(userId);

    if (user == null) {
        return null;
    }

    return user;
};

exports.getIdsFromUsername = async username => {
    //TODO: This should probably just return the user id only.
    try {
        const client = twitchApi.getClient();
        let user = client.kraken.users.getUserByName(username);
        return {
            userId: user.id
        };
    } catch (err) {
        return null;
    }
};

exports.getCurrentViewerList = function(users, continuationToken = null, namesOnly = false) {
    //TODO: Needs to be updated for twitch.
    users = [];
    return users;
};

exports.updateUserRole = async (userId, role, addOrRemove) => {
    //TODO: Needs to be updated for twitch.
};

exports.modUser = async username => {
    return twitchChat.mod(username);
};

exports.unmodUser = async username => {
    return twitchChat.unmod(username);
};

exports.banUser = async username => {
    return twitchChat.ban(username);
};

exports.unbanUser = async username => {
    return twitchChat.unban(username);
};

exports.toggleFollowOnChannel = async (channelIdToFollow, shouldFollow = true) => {
    //TODO: Needs to be updated for twitch.
};

async function startAdBreak(adLength) {
    const client = twitchApi.getClient();
    const streamerAccount = accountAccess.getAccounts().streamer;
    const channelId = (await client.helix.users.getUserByName(streamerAccount.username)).id;

    if (adLength == null) {
        adLength = 30;
    }

    await client.kraken.channels.startChannelCommercial(channelId, adLength);
    logger.debug(`A commercial was run. Length: ${adLength}. Twitch does not send confirmation, so we can't be sure it ran.`);
}

exports.triggerAdBreak = async () => {
    try {
        await startAdBreak();
    } catch (error) {
        renderWindow.webContents.send("error", `Failed to trigger ad-break because: ${error.message}`);
    }
};

