"use strict";

const accountAccess = require("../common/account-access");
const mixerApi = require("../api-access");
let linkHeaderParser = require('parse-link-header');


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

function getContinuationToken(linkHeader) {
    let parsed = linkHeaderParser(linkHeader);
    if (parsed.next) {
        return parsed.next.continuationToken;
    }
    return null;
}

exports.getCurrentViewerList = function(users, continuationToken = null, namesOnly = false) {
    if (users == null) {
        users = [];
    }
    return new Promise(async (resolve, reject) => {

        let streamerChannelId = accountAccess.getAccounts().streamer.channelId;
        let urlRoute = `chats/${streamerChannelId}/users?limit=100`;

        if (continuationToken) {
            let encodedToken = encodeURIComponent(continuationToken);
            urlRoute += `&continuationToken=${encodedToken}`;
        }

        let response;
        try {
            response = await mixerApi.get(urlRoute, "v2", true, true);
        } catch (err) {
            return reject(err);
        }

        let userlistParsed = response.body;
        let userlistMapped = userlistParsed.map(u => {
            return namesOnly ? u.username : {
                userId: u.userId,
                username: u.username,
                user_roles: u.userRoles // eslint-disable-line camelcase
            };
        });

        users = users.concat(userlistMapped);

        let linkHeader = response.headers.link;
        if (linkHeader) {
            let newContinuationToken = getContinuationToken(linkHeader);
            resolve(exports.getCurrentViewerList(users, newContinuationToken, namesOnly));
        } else {
            resolve(users);
        }
    });
};
