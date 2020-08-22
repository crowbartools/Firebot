"use strict";

const userDb = require("../database/userDatabase");
const accountAccess = require("../common/account-access");
const NodeCache = require('node-cache');
const twitchApi = require("../twitch-api/api");
const twitchClient = require("../twitch-api/client");

const followCache = new NodeCache({ stdTTL: 10, checkperiod: 10 });

async function userFollowsChannels(username, channelNames) {
    let userfollowsAllChannels = true;

    for (let channelName of channelNames) {
        let userFollowsChannel = false;

        // check cache first
        let cachedFollow = followCache.get(`${username}:${channelName}`);
        if (cachedFollow !== undefined) {
            userFollowsChannel = cachedFollow;
        } else {
            const userFollowsChannel = await twitchApi.users.doesUserFollowChannel(username, channelName);

            // set cache value
            followCache.set(`${username}:${channelName}`, userFollowsChannel);
        }

        if (!userFollowsChannel) {
            userfollowsAllChannels = false;
            break;
        }
    }

    return userfollowsAllChannels;
}

function getUser(userId) {
    const client = twitchClient.getClient();
    return client.kraken.users.getUser(userId);
}

async function getUserDetails(userId) {

    const firebotUserData = await userDb.getUserById(userId);

    if (!firebotUserData.twitch) {
        return {
            firebotData: firebotUserData || {}
        };
    }

    const twitchUser = await getUser(userId);
    const twitchUserData = {
        id: twitchUser.id,
        username: twitchUser.name,
        displayName: twitchUser.displayName,
        iconUrl: twitchUser.logoUrl,
        creationDate: twitchUser.creationDate
    };

    const streamerData = accountAccess.getAccounts().streamer;

    const client = twitchClient.getClient();
    const userFollowsStreamerResponse = await client.helix.users.getFollows({
        user: userId,
        followedUser: streamerData.userId
    });

    const streamerFollowsUserResponse = await client.helix.users.getFollows({
        user: streamerData.userId,
        followedUser: userId
    });

    const streamerFollowsUser = streamerFollowsUserResponse.data != null &&
        streamerFollowsUserResponse.data.length === 1;
    const userFollowsStreamer = userFollowsStreamerResponse.data != null &&
        userFollowsStreamerResponse.data.length === 1;

    if (twitchUserData) {
        twitchUserData.relationship = null;
    }

    const userDetails = {
        firebotData: firebotUserData || {},
        twitchData: twitchUserData,
        streamerFollowsUser: streamerFollowsUser,
        userFollowsStreamer: userFollowsStreamer
    };

    return userDetails;
}

exports.getUser = getUser;
exports.getUserDetails = getUserDetails;
exports.userFollowsChannels = userFollowsChannels;