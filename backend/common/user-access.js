"use strict";

const userDb = require("../database/userDatabase");
const accountAccess = require("../common/account-access");
const channelAccess = require("./channel-access");
const mixerApi = require("../api-access");
const NodeCache = require('node-cache');
const logger = require('../logwrapper');
const twitchClient = require("../twitch-api/client");
const { streamer } = require("../mixer-api/client");

const followCache = new NodeCache({ stdTTL: 10, checkperiod: 10 });

async function userFollowsChannels(userId, channelNamesOrIds) {
    let userfollowsAllChannels = true;

    for (let channelNameOrId of channelNamesOrIds) {
        let userFollowsChannel = false;

        // check cache first
        let cachedFollow = followCache.get(`${userId}:${channelNameOrId}`);
        if (cachedFollow !== undefined) {
            userFollowsChannel = cachedFollow;
        } else {
            // fetch relationship data

            let channelId;
            // fetch channel id if needed
            if (isNaN(channelNameOrId)) {
                const ids = await channelAccess.getIdsFromUsername(channelNameOrId);
                if (ids == null) {
                    // channel doesnt exist
                    logger.warn('Follow Check: ' + channelNameOrId + " doesnt exist. Check failed.");
                    userfollowsAllChannels = false;
                    break;
                }
                channelId = ids.channelId;
            } else {
                channelId = channelNameOrId;
            }

            let userRelationshipData = await mixerApi.get(`channels/${channelId}/relationship?user=${userId}`, "v1", false, true);

            if (userRelationshipData != null) {
                userFollowsChannel = userRelationshipData.status && userRelationshipData.status.follows != null;
            } else {
                userFollowsChannel = false;
            }
            // set cache value
            followCache.set(`${userId}:${channelNameOrId}`, userFollowsChannel);
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

    let firebotUserData = await userDb.getUserById(userId);

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