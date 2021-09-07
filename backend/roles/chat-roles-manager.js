"use strict";

const accountAccess = require("../common/account-access");
const twitchApi = require("../twitch-api/client");
const logger = require("../logwrapper");
const NodeCache = require("node-cache");

const userRoleCache = new NodeCache({ stdTTL: 30, checkperiod: 5 });

const isBroadcaster = (username) => {
    return username === accountAccess.getAccounts().streamer.username;
};

const isModerator = async (userId) => {
    try {
        const client = twitchApi.getClient();
        const moderators = await client.helix.moderation.getModeratorsPaginated(accountAccess.getAccounts().streamer.userId).getAll();

        if (moderators) {
            for (const moderator of moderators) {
                if (moderator.userId === userId) {
                    return true;
                }
            }
        }

        return false;
    } catch (error) {
        logger.debug("Failed to get moderators", error);
        return false;
    }
};

const isVip = async (username) => {
    try {
        const twitchChat = require("../chat/twitch-chat");
        const vips = await twitchChat.getVips();

        if (vips) {
            for (const vip of vips) {
                if (vip === username) {
                    return true;
                }
            }
        }

        return false;
    } catch (error) {
        logger.error("Failed to get vips", error);
        return false;
    }
};

const getSubRoles = async (userId) => {
    const client = twitchApi.getClient();
    const subInfo = await client.helix.subscriptions.getSubscriptionForUser(accountAccess.getAccounts().streamer.userId, userId);

    if (subInfo && subInfo.tier) {
        let tierRole = "";
        switch (subInfo.tier) {
        case "1000":
            tierRole = "tier1";
            break;
        case "2000":
            tierRole = "tier2";
            break;
        case "3000":
            tierRole = "tier3";
            break;
        }

        if (tierRole) {
            return ["sub", tierRole];
        }
    }

    return [];
};

const getChatRoles = async (userIdOrName) => {
    /** @type {import("twitch/lib").HelixUser} */
    let user = {};
    let roles = [];
    const isName = isNaN(userIdOrName);

    const cachedRoles = userRoleCache.get(userIdOrName);

    if (cachedRoles != null) {
        return cachedRoles;
    }

    try {
        const client = twitchApi.getClient();

        if (isName) {
            user = await client.helix.users.getUserByName(userIdOrName);
        } else {
            user = await client.helix.users.getUserById(userIdOrName);
        }
    } catch (error) {
        logger.error("Failed to get user", error);
    }

    if (user) {
        const userIsModerator = await isModerator(user.id);
        const userIsVip = await isVip(user.name);
        const subRoles = await getSubRoles(user.id);

        if (isBroadcaster(user.name)) {
            roles.push("broadcaster");
        }

        if (userIsModerator) {
            roles.push("mod");
        }

        if (userIsVip) {
            roles.push("vip");
        }

        if (subRoles) {
            roles = roles.concat(subRoles);
        }
    }


    userRoleCache.set(user.id, roles);
    userRoleCache.set(user.name, roles);

    return roles;
};

exports.getChatRoles = getChatRoles;