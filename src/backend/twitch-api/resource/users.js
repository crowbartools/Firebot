"use strict";

const accountAccess = require("../../common/account-access");
const twitchApi = require("../api");

/**
 * @param {string} username
 * @returns {Promise<Date>}
 */
const getFollowDateForUser = async (username) => {
    const client = twitchApi.getClient();
    const streamerData = accountAccess.getAccounts().streamer;

    const userId = (await client.users.getUserByName(username)).id;
    const user = await client.users.getUserByName(username);
    let followerDate;

    if (username.toLowerCase() !== streamerData.username) {
        followerDate = (await client.users.getFollowFromUserToBroadcaster(userId, streamerData.userId)).followDate;
    } else {
        followerDate = user.creationDate;
    }

    if (followerDate == null || followerDate.length < 1) {
        return null;
    }

    return new Date(followerDate);
};

/**
 * @param {string} username
 * @param {string} channelName
 * @returns {Promise<boolean>}
 */
const doesUserFollowChannel = async (username, channelName) => {
    if (username == null || channelName == null) {
        return false;
    }

    const client = twitchApi.getClient();

    if (username.toLowerCase() === channelName.toLowerCase()) {
        return true;
    }

    const [user, channel] = await client.users.getUsersByNames([username, channelName]);

    if (user.id == null || channel.id == null) {
        return false;
    }

    const userFollow = await client.users.userFollowsBroadcaster(user.id, channel.id);

    return userFollow != null ? userFollow : false;
};

exports.getFollowDateForUser = getFollowDateForUser;
exports.doesUserFollowChannel = doesUserFollowChannel;
