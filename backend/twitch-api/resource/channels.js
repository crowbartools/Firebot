"use strict";

const twitchApi = require("../api");
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
 *
 * @param {import("@twurple/api").HelixChannel} channelInfo
 * @returns {TwitchChannelInformation}
 */
const mapChannelInformation = async (channelInfo) => {
    /** @type {TwitchChannelInformation} */

    try {
        const broadcaster = await channelInfo.getBroadcaster();
        const game = await channelInfo.getGame();

        if (broadcaster && game) {
            return {
                broadcaster_id: broadcaster.id, // eslint-disable-line camelcase
                game_name: game.name, // eslint-disable-line camelcase
                game_id: game.id, // eslint-disable-line camelcase
                title: channelInfo.title,
                broadcaster_language: channelInfo.language // eslint-disable-line camelcase
            };
        }

        return {};
    } catch (error) {
        logger.error("Failed to get broadcaster or game for channel information", error);
        return {};
    }
};

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
        const response = await client.channels.getChannelInfo(broadcasterId);

        /**@type {TwitchChannelInformation} */
        if (response) {
            return mapChannelInformation(response);
        }

        return null;
    } catch (error) {
        logger.error("Failed to get twitch channel info", error);
        return null;
    }
};

const getOnlineStatus = async(username) => {
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

const updateChannelInformation = async (title = undefined, gameId = undefined) => {
    const client = twitchApi.getClient();
    await client.channels.updateChannelInfo(accountAccess.getAccounts().streamer.userId, {title: title, gameId: gameId});
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

const triggerAdBreak = async (adLength) => {
    try {
        const client = twitchApi.getClient();
        const userId = accountAccess.getAccounts().streamer.userId;

        if (adLength == null) {
            adLength = 30;
        }

        await client.channels.startChannelCommercial(userId, adLength);

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