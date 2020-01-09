"use strict";

const userDb = require("../database/userDatabase");
const accountAccess = require("../common/account-access");
const mixerApi = require("../api-access");

async function getUserDetails(userId) {

    let firebotUserData = await userDb.getUserById(userId);

    let mixerUserData = await mixerApi.get(`users/${userId}`, "v1", false, false);

    let streamerFollowsUser = false;
    if (mixerUserData) {
        const streamerData = accountAccess.getAccounts().streamer;

        let relationshipData = await mixerApi.get(`channels/${streamerData.channelId}/relationship?user=${userId}`,
            "v1", false, true);
        mixerUserData.relationship = relationshipData ? relationshipData.status : null;

        let streamerRelationshipData = await mixerApi
            .get(`channels/${mixerUserData.channel.id}/relationship?user=${streamerData.userId}`, "v1", false, true);
        if (streamerRelationshipData) {
            streamerFollowsUser = streamerRelationshipData.status && streamerRelationshipData.status.follows != null;
        }
    }

    const userDetails = {
        firebotData: firebotUserData || {},
        mixerData: mixerUserData,
        streamerFollowsUser: streamerFollowsUser
    };

    return userDetails;
}

exports.getUserDetails = getUserDetails;