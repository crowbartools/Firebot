"use strict";

const logger = require('../logwrapper');
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

exports.getViewersMixerRoles = function(username) {
    return new Promise(async resolve => {
        let idData = await exports.getIdsFromUsername(username);

        if (idData == null) {
            return resolve([]);
        }

        let chatUser = await exports.getChatUser(idData.userId);

        if (chatUser == null) {
            return resolve([]);
        }

        resolve(chatUser.userRoles);
    });
};

exports.getChatUser = function(userId) {
    return new Promise(async resolve => {
        let streamerData = accountAccess.getAccounts().streamer;
        try {
            let chatUser = await mixerApi
                .get(`chats/${streamerData.channelId}/users/${userId}`, "v1", false, true);
            resolve(chatUser);
        } catch (err) {
            resolve(null);
        }
    });
};

exports.getIdsFromUsername = function(username) {
    return new Promise(async resolve => {
        try {
            let ids = await mixerApi.get(`channels/${username}?fields=id,userId`, "v1", false, false);
            resolve({
                channelId: ids.id,
                userId: ids.userId
            });
        } catch (err) {
            resolve(null);
        }
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

exports.getChannelProgressionByUsername = async function(username) {

    let idData = await exports.getIdsFromUsername(username);

    if (idData == null) {
        return null;
    }

    return exports.getChannelProgressionForUser(idData.userId);
};


exports.getChannelProgressionForUser = async function(userId) {
    let streamerData = accountAccess.getAccounts().streamer;
    try {
        let chatProgression = await mixerApi
            .get(`ascension/channels/${streamerData.channelId}/users/${userId}`, "v1", false, true);
        return chatProgression && chatProgression.level;
    } catch (err) {
        return null;
    }
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

exports.updateUserRole = async (userId, role, addOrRemove) => {

    if (userId == null || (role !== "Mod" && role !== "Banned")) return;

    let streamerData = accountAccess.getAccounts().streamer;

    let body = {};
    let key = addOrRemove ? "add" : "remove";
    body[key] = [role];

    try {
        await mixerApi.patch(`channels/${streamerData.channelId}/users/${userId}`, body);
    } catch (err) {
        logger.error("Error while updating user roles", err);
    }
};

exports.toggleFollowOnChannel = async (channelIdToFollow, shouldFollow = true) => {

    let streamerUserId = accountAccess.getAccounts().streamer.userId;

    try {
        if (shouldFollow) {
            await mixerApi.post(`channels/${channelIdToFollow}/follow`, {
                user: streamerUserId
            });
        } else {
            await mixerApi.delete(`channels/${channelIdToFollow}/follow?user=${streamerUserId}`);
        }
    } catch (err) {
        logger.error("Error while following/unfollowing channel", err);
    }
};
