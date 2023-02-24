"use strict";

const userDb = require("../database/userDatabase");
const accountAccess = require("../common/account-access");
const NodeCache = require('node-cache');
const twitchApi = require("../twitch-api/api");
const logger = require("../logwrapper");
const chatHelpers = require("../chat/chat-helpers");
const activeUserHandler = require("../chat/chat-listeners/active-user-handler");
const frontendCommunicator = require("../common/frontend-communicator");
const chatRolesManager = require("../roles/chat-roles-manager");
const teamRolesManager = require("../roles/team-roles-manager");

const followCache = new NodeCache({ stdTTL: 10, checkperiod: 10 });

async function userFollowsChannels(username, channelNames) {
    let userfollowsAllChannels = true;

    for (const channelName of channelNames) {
        let userFollowsChannel = false;

        // check cache first
        const cachedFollow = followCache.get(`${username}:${channelName}`);
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

function getUser(userId) {
    const client = twitchApi.getClient();
    return client.users.getUserById(userId);
}

async function getUserDetails(userId) {

    const firebotUserData = await userDb.getUserById(userId);

    if (firebotUserData != null && !firebotUserData.twitch) {
        return {
            firebotData: firebotUserData || {}
        };
    }

    let twitchUser;
    try {
        twitchUser = await getUser(userId);
    } catch (error) {
        // fail silently for now
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

    const userRoles = await chatRolesManager.getUsersChatRoles(twitchUser.id);

    if (firebotUserData && firebotUserData.profilePicUrl !== twitchUser.profilePictureUrl) {
        chatHelpers.setUserProfilePicUrl(twitchUser.id, twitchUser.profilePictureUrl);

        firebotUserData.profilePicUrl = twitchUser.profilePictureUrl;
        userDb.updateUser(firebotUserData);

        frontendCommunicator.send("twitch:chat:user-updated", {
            id: firebotUserData._id,
            username: firebotUserData.displayName,
            roles: userRoles,
            profilePicUrl: firebotUserData.profilePicUrl,
            active: activeUserHandler.userIsActive(firebotUserData._id)
        });
    }

    const streamerData = accountAccess.getAccounts().streamer;

    const client = twitchApi.getClient();

    let isBanned;
    try {
        isBanned = await client.moderation.checkUserBan(streamerData.userId, twitchUser.id);
    } catch (error) {
        logger.warn("Unable to get banned status", error);
    }

    const teamRoles = await teamRolesManager.getAllTeamRolesForViewer(twitchUser.name);

    const userFollowsStreamerResponse = await client.channels.getChannelFollowers(
        streamerData.userId,
        streamerData.userId,
        userId
    );

    const streamerFollowsUserResponse = await client.channels.getFollowedChannels(
        streamerData.userId,
        userId
    );

    const streamerFollowsUser = streamerFollowsUserResponse.data != null &&
        streamerFollowsUserResponse.data.length === 1;
    const userFollowsStreamer = userFollowsStreamerResponse.data != null &&
        userFollowsStreamerResponse.data.length === 1;

    if (twitchUserData) {
        twitchUserData.followDate = userFollowsStreamer &&
            userFollowsStreamerResponse.data[0].followDate;
        twitchUserData.isBanned = isBanned;
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

exports.getUser = getUser;
exports.getUserDetails = getUserDetails;
exports.userFollowsChannels = userFollowsChannels;