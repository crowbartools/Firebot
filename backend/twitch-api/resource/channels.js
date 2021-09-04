"use strict";

const twitchApi = require("../client");
const accountAccess = require("../../common/account-access");
const logger = require('../../logwrapper');

/**
 * @typedef TwitchChannelInformation
 * @property {string} broadcaster_id Twitch User ID of this channel owner
 * @property {string} game_name Name of the game being played on the channel
 * @property {string} game_id Current game ID being played on the channel
 * @property {string} title Title of the stream
 * @property {string} broadcaster_language Language of the channel
 */

/**
 * Get channel info (game, title, etc) for the given broadcaster user id
 * @param {string} [broadcasterId] The id of the broadcaster to get channel info for. Defaults to Streamer channel if left blank.
 * @returns {Promise<TwitchChannelInformation>}
 */
const getChannelInformation = async (broadcasterId) => {

    // default to streamer id
    if (broadcasterId == null || broadcasterId === "") {
        broadcasterId = accountAccess.getAccounts().streamer.userId;
    }

    const client = twitchApi.getClient();
    try {
        const response = await client.helix.channels.getChannelInfo(broadcasterId);

        if (response == null || response.data == null || response.data.length < 1) {
            return null;
        }
        /**@type {TwitchChannelInformation} */
        return response.data[0];
    } catch (error) {
        logger.error("Failed to get twitch channel info", error);
        return null;
    }
};

const getOnlineStatus = async (username) => {
    const client = twitchApi.getClient();
    if (client == null) {
        return false;
    }

    try {
        const stream = await client.helix.streams.getStreamByUserName(username);
        if (stream != null) {
            return true;
        }
    } catch (error) {
        logger.error("Error while trying to get streamers broadcast", error);
    }

    return false;
};

const updateChannelInformation = async (title = undefined, gameId = undefined) => {
    const client = twitchApi.getClient();
    try {
        await client.helix.channels.updateChannelInfo(accountAccess.getAccounts().streamer.userId, {title: title, gameId: gameId});
    } catch (error) {
        logger.error("Failed to update channel information", error);
    }
};

/**
 * Get channel info (game, title, etc) for the given username
 * @param {string} username The id of the broadcaster to get channel info for.
 * @returns {Promise<TwitchChannelInformation>}
 */
const getChannelInformationByUsername = async (username) => {
    if (username == null) {
        return null;
    }

    const client = twitchApi.getClient();
    /**@type {import("twitch/lib").HelixUser} */
    let user;
    try {
        user = await client.helix.users.getUserByName(username);
    } catch (error) {
        logger.error(`Error getting user with username ${username}`, error);
    }

    if (user == null) {
        return null;
    }

    return getChannelInformation(user.id);
};

const triggerAdBreak = async (adLength) => {
    try {
        const client = twitchApi.getClient();
        const userId = accountAccess.getAccounts().streamer.userId;

        if (adLength == null) {
            adLength = 30;
        }

        await client.helix.channels.startChannelCommercial(userId, adLength);

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