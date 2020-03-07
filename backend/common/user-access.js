"use strict";

const userDb = require("../database/userDatabase");
const accountAccess = require("../common/account-access");
const channelAccess = require("./channel-access");
const mixerApi = require("../api-access");

async function userFollowsUsers(userId, followCheckList) {
    console.log('Starting check!');
    console.log(userId);
    console.log(followCheckList);
    let userFollowsUser = false;

    for (let streamer of followCheckList) {
        console.log('Does user follow: ' + streamer + '?');

        if (isNaN(streamer)) {
            let streamerData = await mixerApi.get(`channels/${streamer}?fields=id`, "v1", false, false);
            console.log('WHERE IS MY RESPONSE:');
            console.log(streamerData);
            if (streamerData != null) {
                streamer = streamerData.id;
            }

            console.log('STREAMER ID FROM USERNAME');
            console.log(streamer);

            if (streamer == null) {
                console.log('Streamer was null 2');
                userFollowsUser = false;
                break;
            }
        }

        console.log('About to find relationship for ' + userId + ' following ' + streamer);
        let userRelationshipData = await mixerApi.get(`channels/${userId}/relationship?user=${streamer}`, "v1", false, true);
        console.log(userRelationshipData);

        if (!userRelationshipData) {
            userFollowsUser = userRelationshipData.status && userRelationshipData.status.follows != null;
            console.log("user follows user: " + userFollowsUser);
        }

        if (userFollowsUser) {
            console.log('User follows person!');
            userFollowsUser = true;
        }

        console.log('User doesnt follow person!');
        userFollowsUser = false;
        break;
    }

    console.log('User follows person!');
    return userFollowsUser;
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