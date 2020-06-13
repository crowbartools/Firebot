"use strict";

const logger = require('../logwrapper');
const accountAccess = require("../common/account-access");
const mixerApi = require("../api-access");

const api = require("../mixer-api/api");

const deepmerge = require("deepmerge");
const uuidv4 = require("uuid/v4");
const NodeCache = require("node-cache");
let linkHeaderParser = require('parse-link-header');

// Holds an updating model of the streamers channel data.
/**@type {import('../mixer-api/resource/channels').MixerChannelSimple} */
let streamerChannelData;

exports.refreshStreamerChannelData = async () => {
    let streamerData = accountAccess.getAccounts().streamer;
    streamerChannelData = await this.getMixerAccountDetailsByUsername(streamerData.username);
};

exports.updateStreamerChannelData = async (newData) => {
    if (streamerChannelData == null) {
        await this.refreshStreamerChannelData();
    }

    streamerChannelData = deepmerge(streamerChannelData, newData);
    return streamerChannelData;
};

exports.getStreamerChannelData = async () => {
    if (streamerChannelData == null) {
        await this.refreshStreamerChannelData();
    }

    return streamerChannelData;
};

exports.getFollowDateForUser = async username => {
    let streamerData = accountAccess.getAccounts().streamer;

    let followerData = await mixerApi.get(
        `channels/${streamerData.channelId}/follow?where=username:eq:${username}`,
        "v1",
        false,
        false
    );

    if (followerData == null || followerData.length < 1) {
        return null;
    }

    return new Date(followerData[0].followed.createdAt);
};

exports.getStreamerSubBadge = async () => {
    if (!streamerChannelData || !streamerChannelData.badge) {
        return null;
    }
    return streamerChannelData.badge.url;
};

exports.getStreamerOnlineStatus = async () => {
    if (streamerChannelData == null) {
        return false;
    }

    return streamerChannelData.online === true;
};

exports.getStreamerAudience = async () => {
    if (streamerChannelData == null) {
        return null;
    }

    return streamerChannelData.audience;
};

exports.setStreamerAudience = async (audience) => {
    await api.channels.updateStreamersChannel({
        audience: audience
    });
};

exports.getStreamerGameData = async () => {
    if (streamerChannelData == null) {
        return null;
    }

    return streamerChannelData.type;
};

exports.setStreamGameById = async typeId => {
    await api.channels.updateStreamersChannel({
        typeId: typeId
    });
};

exports.setStreamGameByName = async typeNameQuery => {
    const types = await api.types.searchChannelTypes(typeNameQuery);
    if (types.length > 0) {
        await api.channels.updateStreamersChannel({
            typeId: types[0].id
        });
    }
};

exports.setStreamTitle = async newTitle => {
    await api.channels.updateStreamersChannel({
        name: newTitle
    });
};

const viewerRoleCache = new NodeCache({ stdTTL: 10, checkperiod: 10 });

exports.getViewersMixerRoles = async username => {

    let cachedRoles = viewerRoleCache.get(username);
    if (cachedRoles != null) {
        return cachedRoles;
    }

    let idData = await exports.getIdsFromUsername(username);

    if (idData == null) {
        return [];
    }

    let chatUser = await exports.getChatUser(idData.userId);

    if (chatUser == null) {
        return [];
    }

    let userRoles = chatUser.userRoles || [];

    viewerRoleCache.set(username, userRoles);

    return chatUser.userRoles;
};

exports.getChatUser = async userId => {
    let streamerData = accountAccess.getAccounts().streamer;
    try {
        return await mixerApi.get(`chats/${streamerData.channelId}/users/${userId}`, "v1", false, true);
    } catch (err) {
        return null;
    }
};

exports.getIdsFromUsername = async username => {
    try {
        let ids = await mixerApi.get(`channels/${username}?fields=id,userId`, "v1", false, false);
        return {
            channelId: ids.id,
            userId: ids.userId
        };

    } catch (err) {
        return null;
    }
};

exports.getMixerAccountDetailsByUsername = async username => {

    let userData = await mixerApi.get(
        `channels/${username}`,
        "v1",
        false,
        false
    );

    if (userData == null) {
        return null;
    }

    return userData;
};

exports.getMixerAccountDetailsById = channelIdOrUsername => {
    return exports.getMixerAccountDetailsByUsername(channelIdOrUsername);
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

exports.giveHeartsToUser = async (userId, amount) => {
    let streamerData = accountAccess.getAccounts().streamer;
    try {
        await mixerApi.post(`ascension/channels/${streamerData.channelId}/users/${userId}/grant`, {
            xp: amount
        });
        return exports.getChannelProgressionForUser(userId);
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

exports.modUser = async username => {
    const ids = await exports.getIdsFromUsername(username);
    return api.channels.updateUserRoles(ids.userId, ["Mod"]);
};

exports.unmodUser = async username => {
    const ids = await exports.getIdsFromUsername(username);
    return api.channels.updateUserRoles(ids.userId, null, ["Mod"]);
};

exports.banUser = async username => {
    const ids = await exports.getIdsFromUsername(username);
    return api.channels.updateUserRoles(ids.userId, ["Banned"]);
};

exports.unbanUser = async username => {
    const ids = await exports.getIdsFromUsername(username);
    return api.channels.updateUserRoles(ids.userId, null, ["Banned"]);
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

async function startAdBreak() {
    let streamerData = accountAccess.getAccounts().streamer;

    try {
        await mixerApi.post(`ads/channels/${streamerData.channelId}`, {
            requestId: uuidv4()
        }, "v2", false, true, true);
    } catch (error) {
        let { response, body } = error;

        let errorReason = "Unknown error occured.";

        if (response.statusCode === 401) {
            errorReason = "Unauthorized";
        } else if (response.statusCode === 403) {
            errorReason = "Missing required permissions to trigger an ad-break. Please re-log into your Streamer account.";
        } else if (response.statusCode === 429) {
            errorReason = "You've already run two ads in the last 15 minutes!";
        } else if (response.statusCode === 400) {
            errorReason = body.errorMessage ? body.errorMessage.replace("[DEBUG] ") : "Something went wrong.";
        }
        throw new Error(errorReason);
    }
}

exports.triggerAdBreak = async () => {
    try {
        await startAdBreak();
    } catch (error) {
        renderWindow.webContents.send("error", `Failed to trigger ad-break because: ${error.message}`);
    }
};

const clipGroups = ["Partner", "VerifiedPartner", "Staff", "Founder"];
exports.getChannelHasClipsEnabled = async (channelId, userGroups = null) => {
    if (userGroups == null) {
        let channelData = await exports.getMixerAccountDetailsById(channelId);
        if (channelData == null || channelData.user == null || channelData.user.groups == null) return false;
        userGroups = channelData.user.groups;
    }

    let roleCanClip = userGroups.some(ug => clipGroups.some(cg => ug.name === cg));
    if (roleCanClip) {
        return true;
    }

    let entitlementsData = await mixerApi.get(
        `monetization/status/channels/${channelId}/entitlements/current`,
        "v2",
        false,
        false
    );

    if (entitlementsData != null && entitlementsData.entitlements != null) {
        if (entitlementsData.entitlements.some(e => e.revenueSource.toLowerCase().includes("clip"))) {
            return true;
        }
    }

    return false;
};

