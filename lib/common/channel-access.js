"use strict";

const accountAccess = require("../common/account-access");
const mixerApi = require("../api-access");


exports.getFollowDateForUser = function(username) {
    return new Promise(async resolve => {
        let streamerData = accountAccess.getAccounts().streamer;

        let followerData = await mixerApi.get(
            `channels/${streamerData.channelId}/follow?where=username:eq:${username}`,
            "v1",
            false,
            false
        );

        if (followerData == null || followerData.length < 1) {
            return resolve(null);
        }

        resolve(new Date(followerData[0].followed.createdAt));
    });
};

exports.getStreamerOnlineStatus = function() {
    return new Promise(async resolve => {
        let streamerData = accountAccess.getAccounts().streamer;

        let onlineData = await mixerApi.get(
            `channels/${streamerData.channelId}?fields=online`,
            "v1",
            false,
            true
        );

        if (onlineData == null) {
            return resolve(false);
        }

        resolve(onlineData.online === true);
    });
};

exports.getMixerAccountDetailsByUsername = function(username) {
    return new Promise(async resolve => {

        let userData = await mixerApi.get(
            `channels/${username}`,
            "v1",
            false,
            false
        );

        if (userData == null) {
            return resolve(null);
        }

        resolve(userData);
    });
};
