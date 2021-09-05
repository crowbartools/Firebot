"use strict";

const accountAccess = require("../../common/account-access");

const twitchApi = require("../client");
const { TwitchAPICallType } = require("twitch/lib");

const NodeCache = require("node-cache");
const logger = require("../../logwrapper");

const userRoleCache = new NodeCache({ stdTTL: 30, checkperiod: 5 });

const getUserChatInfo = async (userId) => {
    const client = twitchApi.getClient();

    const streamer = accountAccess.getAccounts().streamer;

    const chatUser = await client.callApi({
        type: TwitchAPICallType.Kraken,
        url: `users/${userId}/chat/channels/${streamer.userId}`
    });

    return chatUser;
};

const getUserChatInfoByName = async (username) => {
    try {
        const client = twitchApi.getClient();
        const user = await client.helix.users.getUserByName(username);
        return getUserChatInfo(user.id);
    } catch (error) {
        logger.error("Couldn't get user chat info by name", error);
    }
};

const getUserSubInfo = async (userId) => {
    try {
        const client = twitchApi.getClient();
        const streamer = accountAccess.getAccounts().streamer;
        const subInfo = await client.helix.subscriptions.getSubscriptionForUser(streamer.userId, userId);
        return subInfo;
    } catch (error) {
        logger.error("Couldn't get user sub info", error);
    }
};

const getUserSubInfoByName = async (username) => {
    try {
        const client = twitchApi.getClient();
        const user = await client.helix.users.getUserByName(username);

        return getUserSubInfo(user.id);
    } catch (error) {
        logger.error("Couldn't get user sub info by name", error);
    }
};

const getUserSubscriberRole = async (userIdOrName) => {
    const isName = isNaN(userIdOrName);
    const subInfo = isName ?
        (await getUserSubInfoByName(userIdOrName)) :
        (await getUserSubInfo(userIdOrName));

    if (subInfo == null || subInfo.tier == null) {
        return null;
    }

    let role = '';
    switch (subInfo.tier) {
    case "1000":
        role = "tier1";
        break;
    case "2000":
        role = "tier2";
        break;
    case "3000":
        role = "tier3";
        break;
    }

    return role;
};

const getUsersChatRoles = async (userIdOrName = "") => {

    userIdOrName = userIdOrName.toLowerCase();

    /**@type {string[]} */
    const cachedRoles = userRoleCache.get(userIdOrName);

    if (cachedRoles != null) {
        return cachedRoles;
    }

    const isName = isNaN(userIdOrName);

    const userChatInfo = isName ?
        (await getUserChatInfoByName(userIdOrName)) :
        (await getUserChatInfo(userIdOrName));

    const subscriberRole = await getUserSubscriberRole(userIdOrName);

    if (userChatInfo == null && subscriberRole == null) {
        return [];
    }

    const roles = [];
    if (userChatInfo.badges) {
        for (let badge of userChatInfo.badges) {
            if (badge.id === "broadcaster") {
                roles.push("broadcaster");
            } else if (badge.id === "subscriber" || badge.id === "founder") {
                roles.push("sub");
            } else if (badge.id === "vip") {
                roles.push("vip");
            } else if (badge.id === "moderator") {
                roles.push("mod");
            }
        }
    }

    if (subscriberRole != null) {
        roles.push(subscriberRole);
    }

    userRoleCache.set(userChatInfo._id, roles);
    userRoleCache.set(userChatInfo.login, roles);

    return roles;
};

const blockUser = async (userId) => {
    if (userId == null) return;

    const client = twitchApi.getClient();

    try {
        await client.callApi({
            type: TwitchAPICallType.Helix,
            method: "PUT",
            url: "users/blocks",
            query: {
                "target_user_id": userId
            }
        });

        return true;
    } catch (err) {
        logger.error("Couldn't block user", err);
        return false;
    }
};

const blockUserByName = async (username) => {
    try {
        const client = twitchApi.getClient();
        const user = await client.helix.users.getUserByName(username);
        blockUser(user.id);
    } catch (err) {
        logger.error("Couldn't block user", err);
    }
};

const unblockUser = async (userId) => {
    if (userId == null) return;

    const client = twitchApi.getClient();

    try {
        await client.callApi({
            type: TwitchAPICallType.Helix,
            method: "DELETE",
            url: "users/blocks",
            query: {
                "target_user_id": userId
            }
        });

        return true;
    } catch (err) {
        logger.error("Couldn't unblock user", err);

        return false;
    }
};

const unblockUserByName = async (username) => {
    try {
        const client = twitchApi.getClient();
        const user = await client.helix.users.getUserByName(username);
        unblockUser(user.id);
    } catch (err) {
        logger.error("Couldn't unblock user", err);
    }
};

const getAllBlockedUsers = async (userId, cursor) => {
    const client = twitchApi.getClient();

    try {
        let response = {};

        if (cursor == null) {
            response = await client.callApi({
                type: TwitchAPICallType.Helix,
                url: "users/blocks",
                query: {
                    "broadcaster_id": userId
                }
            });
        } else {
            response = await client.callApi({
                type: TwitchAPICallType.Helix,
                url: "users/blocks",
                query: {
                    "broadcaster_id": userId,
                    after: cursor
                }
            });
        }

        if (response == null || response.data == null || response.data.length < 1) {
            logger.error("Couldn't find any blocked users");
            return null;
        }

        return response;
    } catch (error) {
        logger.error("Failed to get blocked users", error);
        return null;
    }
};

const getAllBlockedUsersPaginated = async (streamerId) => {
    let response = await getAllBlockedUsers(streamerId);
    if (response == null) return;

    let cursor = "";
    let blockedUsers = response.data.map(u => u.user_id);

    while (response.pagination.cursor && response.pagination.cursor !== cursor) {
        cursor = response.pagination.cursor;
        response = await getAllBlockedUsers(streamerId, cursor);
        blockedUsers = blockedUsers.concat(response.data.map(u => u.user_id));
    }

    return blockedUsers;
};

exports.getUserChatInfoByName = getUserChatInfoByName;
exports.getUsersChatRoles = getUsersChatRoles;
exports.blockUser = blockUser;
exports.blockUserByName = blockUserByName;
exports.unblockUser = unblockUser;
exports.unblockUserByName = unblockUserByName;
exports.getAllBlockedUsersPaginated = getAllBlockedUsersPaginated;