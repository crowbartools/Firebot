"use strict";

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

async function userFollowsChannels(username, channelNames, durationInSeconds = 0) {
    let userfollowsAllChannels = true;

    for (const channelName of channelNames) {
        /**
         * @type {import('@twurple/api').HelixChannelFollower | boolean}
         */
        let userFollow;

        // check cache first
        const cachedFollow = followCache.get(`${username}:${channelName}`);
        if (cachedFollow !== undefined) {
            userFollow = cachedFollow;
        } else {
            userFollow = await twitchApi.users.getUserChannelFollow(username, channelName);

            // set cache value
            followCache.set(`${username}:${channelName}`, userFollow);
        }

        if (!userFollow) {
            userfollowsAllChannels = false;
            break;
        }

        if (userFollow === true) { // streamer follow
            continue;
        }

        if (durationInSeconds > 0) {
            const followTime = Math.round(userFollow.followDate.getTime() / 1000);
            const currentTime = Math.round(new Date().getTime() / 1000);
            if ((currentTime - followTime) < durationInSeconds) {
                userfollowsAllChannels = false;
                break;
            }
        }
    }

    return userfollowsAllChannels;
}

async function getUserDetails(userId) {

    const viewerDatabase = require("../viewers/viewer-database");

    await viewerDatabase.calculateAutoRanks(userId);

    const firebotUserData = await viewerDatabase.getViewerById(userId);

    if (firebotUserData != null && !firebotUserData.twitch) {
        return {
            firebotData: firebotUserData || {}
        };
    }

    /** @type {import("@twurple/api").HelixUser} */
    let twitchUser;
    try {
        twitchUser = await twitchApi.users.getUserById(userId);
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
        profilePicUrl: twitchUser.profilePictureUrl,
        creationDate: twitchUser.creationDate
    };

    const userRoles = await chatRolesManager.getUsersChatRoles(twitchUser.id);

    if (firebotUserData && firebotUserData.profilePicUrl !== twitchUser.profilePictureUrl) {
        chatHelpers.setUserProfilePicUrl(twitchUser.id, twitchUser.profilePictureUrl);

        firebotUserData.profilePicUrl = twitchUser.profilePictureUrl;
        await viewerDatabase.updateViewer(firebotUserData);

        frontendCommunicator.send("twitch:chat:user-updated", {
            id: firebotUserData._id,
            username: firebotUserData.username,
            displayName: firebotUserData.displayName,
            roles: userRoles,
            profilePicUrl: firebotUserData.profilePicUrl,
            active: activeUserHandler.userIsActive(firebotUserData._id)
        });
    }

    const streamerData = accountAccess.getAccounts().streamer;

    const client = twitchApi.streamerClient;

    let isBanned;
    try {
        isBanned = await client.moderation.checkUserBan(streamerData.userId, twitchUser.id);
    } catch (error) {
        logger.warn("Unable to get banned status", error);
    }

    const teamRoles = await teamRolesManager.getAllTeamRolesForViewer(twitchUser.name);

    const userFollowsStreamerResponse = await client.channels.getChannelFollowers(
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

exports.getUserDetails = getUserDetails;
exports.userFollowsChannels = userFollowsChannels;