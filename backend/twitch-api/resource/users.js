"use strict";

const accountAccess = require("../../common/account-access");

const twitchApi = require("../client");
const { TwitchAPICallType } = require("twitch/lib");

const NodeCache = require("node-cache");

const userRoleCache = new NodeCache({ stdTTL: 30, checkperiod: 5 });

async function getUserChatInfo(userId) {
    const client = twitchApi.getClient();

    const streamer = accountAccess.getAccounts().streamer;

    const chatUser = await client.callAPI({
        type: TwitchAPICallType.Kraken,
        url: `users/${userId}/chat/channels/${streamer.userId}`
    });

    return chatUser;
}

async function getUserChatInfoByName(username) {
    const client = twitchApi.getClient();
    try {
        const user = await client.helix.users.getUserByName(username);
        return getUserChatInfo(user.id);
    } catch (error) {
        return null;
    }
}

async function getUsersChatRoles(userIdOrName = "") {

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

    if (userChatInfo == null) {
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

    userRoleCache.set(userChatInfo._id, roles);
    userRoleCache.set(userChatInfo.login, roles);

    return roles;
}

exports.getUsersChatRoles = getUsersChatRoles;

