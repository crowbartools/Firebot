"use strict";

const userDb = require("../database/userDatabase");
const accountAccess = require("../common/account-access");
const channelAccess = require("./channel-access");
const mixerApi = require("../api-access");

async function userFollowsUsers(userId, followCheckList) {
    followCheckList.forEach(async (streamer) => {
        let userFollowsUser = false;
        if (streamer == null) {
            return false;
        }

        if (isNaN(streamer)) {
            let streamerData = await mixerApi.get(`channels/${streamer}?fields=id`, "v1", false, false);
            if (streamerData != null) {
                streamer = streamerData.id;
            }

            if (streamer == null) {
                return false;
            }
        }

        let userRelationshipData = await mixerApi.get(`channels/${userId}/relationship?user=${streamer}`, "v1", false, true);

        if (!userRelationshipData) {
            userFollowsUser = userRelationshipData.status && userRelationshipData.status.follows != null;
        }

        if (!userFollowsUser) {
            return false;
        }
    });

    return true;
}

async function getUserDetails(userId) {

    let mixerUserData = await mixerApi.get(`users/${userId}`, "v1", false, false);

    let streamerFollowsUser = false;
    let userFollowsStreamer = false;
    if (mixerUserData) {
        const streamerData = accountAccess.getAccounts().streamer;

        let relationshipData = await mixerApi.get(`channels/${streamerData.channelId}/relationship?user=${userId}`,
            "v1", false, true);
        mixerUserData.relationship = relationshipData ? relationshipData.status : null;

        streamerFollowsUser = userFollowsUsers(streamerData.userId, [mixerUserData.channel.id]);
        userFollowsStreamer = userFollowsUsers(userId, [streamerData.userId]);

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

exports.getUserDetails = getUserDetails;
exports.userFollowsStreamers = userFollowsUsers;