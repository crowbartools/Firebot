"use strict";
const axios = require("axios").default;
const twitchApi = require("../twitch-api/api");
const accountAccess = require("../common/account-access");
const logger = require("../logwrapper");

const VIEWLIST_BOTS_URL = "https://api.twitchinsights.net/v1/bots/all";

let viewerlistBotMap = {};

const cacheViewerListBots = async () => {
    try {
        const responseData = (await axios.get(VIEWLIST_BOTS_URL)).data;
        if (responseData.bots) {
            viewerlistBotMap = responseData?.bots?.reduce((acc, [username, _channels, id]) => {
                acc[username.toLowerCase()] = id;
                return acc;
            }, {}) ?? {};
        }
    } catch {
        // silently fail
    }
};

/** @type {string[]} */
let vips = [];

/**
 * @param {string[]} usersInVipRole
 * @return {void}
 */
const loadUsersInVipRole = (usersInVipRole) => {
    vips = usersInVipRole;
};

/**
 * @param {string} username
 * @return {void}
 */
const addVipToVipList = (username) => {
    if (!vips.includes(username)) {
        vips.push(username);
    }
};

/**
 * @param {string} username
 * @return {void}
 */
const removeVipFromVipList = (username) => {
    vips = vips.filter(vip => vip !== username);
};

/**
 * @param {string} userIdOrName
 * @returns {Promise<string>}
 */
const getUserSubscriberRole = async (userIdOrName) => {
    if (userIdOrName == null || userIdOrName === "") {
        return "";
    }

    const isName = isNaN(userIdOrName);

    const client = twitchApi.streamerClient;
    const userId = isName ? (await twitchApi.users.getUserByName(userIdOrName)).id : userIdOrName;

    const streamer = accountAccess.getAccounts().streamer;
    const subInfo = await client.subscriptions.getSubscriptionForUser(streamer.userId, userId);

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

/**
 * @param {string} [userIdOrName]
 * @returns {Promise<string[]>}
 */
const getUsersChatRoles = async (userIdOrName = "") => {
    if (userIdOrName == null || userIdOrName === "") {
        return [];
    }
    userIdOrName = userIdOrName.toLowerCase();
    const isName = isNaN(userIdOrName);

    const roles = [];

    try {
        const client = twitchApi.streamerClient;
        const username = isName ? userIdOrName : (await twitchApi.users.getUserById(userIdOrName)).name;

        if (viewerlistBotMap[username?.toLowerCase() ?? ""] != null) {
            roles.push("viewerlistbot");
        }

        const streamer = accountAccess.getAccounts().streamer;
        if (!userIdOrName || userIdOrName === streamer.userId || userIdOrName === streamer.username) {
            roles.push("broadcaster");
        }

        if (streamer.broadcasterType !== "") {
            const subscriberRole = await getUserSubscriberRole(userIdOrName);
            if (subscriberRole != null) {
                roles.push("sub");
                roles.push(subscriberRole);
            }
        }

        if (vips.some(v => v.toLowerCase() === username.toLowerCase())) {
            roles.push("vip");
        }

        const moderators = (await client.moderation.getModerators(streamer.userId)).data;
        if (moderators.some(m => m.userName === username)) {
            roles.push("mod");
        }

        return roles;
    } catch (err) {
        logger.error("Failed to get user chat roles", err);
        return [];
    }
};

function userIsKnownBot(username) {
    if (viewerlistBotMap[username?.toLowerCase() ?? ""] != null) {
        return true;
    }
    return false;
}

exports.loadUsersInVipRole = loadUsersInVipRole;
exports.addVipToVipList = addVipToVipList;
exports.removeVipFromVipList = removeVipFromVipList;
exports.getUsersChatRoles = getUsersChatRoles;
exports.cacheViewerListBots = cacheViewerListBots;
exports.userIsKnownBot = userIsKnownBot;