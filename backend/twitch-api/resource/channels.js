"use strict";

const twitchApi = require("../api");
const accountAccess = require("../../common/account-access");
const logger = require('../../logwrapper');

/**
 * Get channel info (game, title, etc) for the given broadcaster user id
 * @param {string} [broadcasterId] The id of the broadcaster to get channel info for. Defaults to Streamer channel if left blank.
 * @returns {Promise<import("@twurple/api").HelixChannel>}
 */
const getChannelInformation = async (broadcasterId) => {

    // default to streamer id
    if (broadcasterId == null || broadcasterId === "") {
        broadcasterId = accountAccess.getAccounts().streamer.userId;
    }

    const client = twitchApi.getClient();
    try {
        const response = await client.channels.getChannelInfoById(broadcasterId);
        return response;
    } catch (error) {
        logger.error("Failed to get twitch channel info", error);
        return null;
    }
};

/**
 * Check whether a streamer is currently live.
 * @param {string} username
 * @returns {Promise<boolean>}
 */
const getOnlineStatus = async (username) => {
    const client = twitchApi.getClient();
    if (client == null) {
        return false;
    }

    try {
        const stream = await client.streams.getStreamByUserName(username);
        if (stream != null) {
            return true;
        }
    } catch (error) {
        logger.error("Error while trying to get streamers broadcast", error);
    }

    return false;
};

/**
 * Update the information of a Twitch channel.
 * @param {import("@twurple/api").HelixChannelUpdate} data
 * @returns {Promise<void>}
 */
const updateChannelInformation = async (data) => {
    const client = twitchApi.getClient();
    await client.channels.updateChannelInfo(accountAccess.getAccounts().streamer.userId, data);
};

/**
 * Get channel info (game, title, etc) for the given username
 * @param {string} username The id of the broadcaster to get channel info for.
 * @returns {Promise<import("@twurple/api").HelixChannel>}
 */
const getChannelInformationByUsername = async (username) => {
    if (username == null) {
        return null;
    }

    const client = twitchApi.getClient();
    /**@type {import("@twurple/api").HelixUser} */
    let user;
    try {
        user = await client.users.getUserByName(username);
    } catch (error) {
        logger.error(`Error getting user with username ${username}`, error);
    }

    if (user == null) {
        return null;
    }

    return getChannelInformation(user.id);
};

/**
 * Trigger a Twitch ad break. Default length 30 seconds.
 * @param {string} [adLength] How long the ad should run.
 * @returns {Promise<boolean>}
 */
const triggerAdBreak = async (adLength = 30) => {
    try {
        const client = twitchApi.getClient();
        const streamer = accountAccess.getAccounts().streamer;

        const isOnline = await getOnlineStatus(streamer.username);
        if (isOnline && streamer.broadcasterType !== "") {
            await client.channels.startChannelCommercial(streamer.userId, adLength);
        }

        logger.debug(`A commercial was run. Length: ${adLength}. Twitch does not send confirmation, so we can't be sure it ran.`);
        return true;
    } catch (error) {
        renderWindow.webContents.send("error", `Failed to trigger ad-break because: ${error.message}`);
        return false;
    }
};

exports.getChannelInformation = getChannelInformation;
exports.getChannelInformationByUsername = getChannelInformationByUsername;
exports.updateChannelInformation = updateChannelInformation;
exports.triggerAdBreak = triggerAdBreak;
exports.getOnlineStatus = getOnlineStatus;
