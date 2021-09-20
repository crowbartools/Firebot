"use strict";

const userDb = require("../database/userDatabase");
const accountAccess = require("../common/account-access");
const NodeCache = require('node-cache');
const twitchApi = require("../twitch-api/api");
const twitchClient = require("../twitch-api/api");
const teamRolesManager = require("../roles/team-roles-manager");
const chatRolesManager = require("../roles/chat-roles-manager");
const logger = require("../logwrapper");

const followCache = new NodeCache({ stdTTL: 10, checkperiod: 10 });

async function userFollowsChannels(username, channelNames) {
    let userfollowsAllChannels = true;

    for (let channelName of channelNames) {
        let userFollowsChannel = false;

        // check cache first
        let cachedFollow = followCache.get(`${username}:${channelName}`);
        if (cachedFollow !== undefined) {
            userFollowsChannel = cachedFollow;
        } else {
            userFollowsChannel = await twitchApi.users.doesUserFollowChannel(username, channelName);

            // set cache value
            followCache.set(`${username}:${channelName}`, userFollowsChannel);
        }

        if (!userFollowsChannel) {
            userfollowsAllChannels = false;
            break;
        }
    }

    return userfollowsAllChannels;
}

async function getUserDetails(userId) {

    const firebotUserData = await userDb.getUserById(userId);

    if (!firebotUserData.twitch) {
        return {
            firebotData: firebotUserData || {}
        };
    }

    let twitchUser;
    try {
        const client = twitchClient.getClient();
        twitchUser = await client.users.getUserById(userId);
    } catch (error) {
        logger.error("Failed to get user data", error);
    }

    if (twitchUser == null) {
        return {
            firebotData: firebotUserData || {}
        };
    }

    const twitchUserData = {
        id: twitchUser.id,
        username: twitchUser.name,
        displayName: twitchUser.displayName,
        iconUrl: twitchUser.profilePictureUrl,
        creationDate: twitchUser.creationDate
    };

    const streamerData = accountAccess.getAccounts().streamer;

    const client = twitchClient.getClient();

    let isBanned;
    try {
        isBanned = await client.moderation.checkUserBan(streamerData.userId, twitchUser.id);
    } catch (error) {
        logger.error("Unable to get banned status", error);
    }

    let isBlocked = false;
    try {
        const blocklist = await twitchApi.getClient().users.getBlocksPaginated(streamerData.userId).getAll();
        if (blocklist) {
            isBlocked = blocklist.some(u => u.userId === twitchUser.id);
        }

    } catch (error) {
        logger.error("Unable to get blocked status", error);
    }

    const userRoles = await chatRolesManager.getChatRoles(twitchUser.id);
    const teamRoles = await teamRolesManager.getAllTeamRolesForViewer(twitchUser.name);

    const userFollowsStreamerResponse = await client.users.getFollows({
        user: userId,
        followedUser: streamerData.userId
    });

    const streamerFollowsUserResponse = await client.users.getFollows({
        user: streamerData.userId,
        followedUser: userId
    });

    const streamerFollowsUser = streamerFollowsUserResponse.data != null &&
        streamerFollowsUserResponse.data.length === 1;
    const userFollowsStreamer = userFollowsStreamerResponse.data != null &&
        userFollowsStreamerResponse.data.length === 1;

    if (twitchUserData) {
        twitchUserData.followDate = userFollowsStreamer &&
            userFollowsStreamerResponse.data[0].followDate;
        twitchUserData.isBanned = isBanned;
        twitchUserData.isBlocked = isBlocked;
        twitchUserData.userRoles = userRoles || [];
        twitchUserData.teamRoles = teamRoles || [];
    }

    const userDetails = {
        firebotData: firebotUserData || {},
        twitchData: twitchUserData,
        streamerFollowsUser: streamerFollowsUser,
        userFollowsStreamer: userFollowsStreamer
    };

    return userDetails;
}

exports.getUserDetails = getUserDetails;
exports.userFollowsChannels = userFollowsChannels;