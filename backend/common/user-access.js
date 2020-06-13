"use strict";

const userDb = require("../database/userDatabase");
const accountAccess = require("../common/account-access");
const channelAccess = require("./channel-access");
const mixerApi = require("../api-access");
const NodeCache = require('node-cache');
const logger = require('../logwrapper');

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
    return mixerApi.get(`users/${userId}`, "v1", false, false);
}

async function getUserDetails(userId) {

    let mixerUserData = await getUser(userId);

    let streamerFollowsUser = false;
    let userFollowsStreamer = false;
    if (mixerUserData) {
        const streamerData = accountAccess.getAccounts().streamer;

        let relationshipData = await mixerApi.get(`channels/${streamerData.channelId}/relationship?user=${userId}`,
            "v1", false, true);
        mixerUserData.relationship = relationshipData ? relationshipData.status : null;

        streamerFollowsUser = await userFollowsChannels(streamerData.userId, [mixerUserData.channel.id]);
        userFollowsStreamer = await userFollowsChannels(userId, [streamerData.userId]);

        let channelLevel = await channelAccess.getChannelProgressionForUser(userId);
        if (channelLevel) {
            mixerUserData.channelLevel = channelLevel;
        }
    }

    let firebotUserData = await userDb.getUserById(userId);

    const userDetails = {
        firebotData: firebotUserData || {},
        mixerData: mixerUserData,
        streamerFollowsUser: streamerFollowsUser,
        userFollowsStreamer: userFollowsStreamer
    };

    return userDetails;
}

exports.getUser = getUser;
exports.getUserDetails = getUserDetails;
exports.userFollowsChannels = userFollowsChannels;