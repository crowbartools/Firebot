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
    console.log(chatUser);
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

const blockUserByName = async (username) => {
    try {
        const client = twitchApi.getClient();
        const user = await client.helix.users.getUserByName(username);
        await client.helix.users.createBlock(user.id);
    } catch (err) {
        logger.error("Couldn't block user", err);
    }
};

const unblockUserByName = async (username) => {
    try {
        const client = twitchApi.getClient();
        const user = await client.helix.users.getUserByName(username);
        await client.helix.users.deleteBlock(user.id);
    } catch (err) {
        logger.error("Couldn't unblock user", err);
    }
};

exports.getUserChatInfoByName = getUserChatInfoByName;
exports.getUsersChatRoles = getUsersChatRoles;
exports.blockUserByName = blockUserByName;
exports.unblockUserByName = unblockUserByName;