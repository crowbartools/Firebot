"use strict";

const userDb = require("../database/userDatabase");
const accountAccess = require("../common/account-access");
const channelAccess = require("./channel-access");
const mixerApi = require("../api-access");
const logger = require('../logwrapper');

async function userFollowsUsers(userId, followCheckList) {
    let userFollowsUsers = false;

    for (let streamer of followCheckList) {
        let streamerData = null;

        if (isNaN(streamer)) {
            try {
                streamerData = await mixerApi.get(`channels/${streamer}?fields=id`, "v1", false, false);
                streamer = streamerData.id;
            } catch (err) {
                logger.debug("Unable to get streamer data for follow check.", err);
                userFollowsUsers = false;
                break;
            }
        }

        let userRelationshipData = await mixerApi.get(`channels/${streamer}/relationship?user=${userId}`, "v1", false, true);

        if (userRelationshipData != null) {
            userFollowsUsers = userRelationshipData.status && userRelationshipData.status.follows != null;
        } else {
            logger.debug('Couldnt get user relationship data for follow check.');
            userFollowsUsers = false;
            break;
        }

        if (userFollowsUsers) {
            userFollowsUsers = true;
            continue;
        }

        userFollowsUsers = false;
        break;
    }

    return userFollowsUsers;
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

        streamerFollowsUser = await userFollowsUsers(streamerData.userId, [mixerUserData.channel.id]);
        userFollowsStreamer = await userFollowsUsers(userId, [streamerData.userId]);

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
exports.userFollowsUsers = userFollowsUsers;