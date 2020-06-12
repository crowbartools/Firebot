"use strict";

const logger = require("../../logwrapper");
const Mixer = require("@mixer/client-node");
const mixerClient = require("../client");
const accountAccess = require("../../common/account-access");

/**
 * @typedef {Object} MixerChannelSimple
 * @property {number} id - The unique ID of the channel.
 * @property {number} userId - The ID of the user owning the channel.
 * @property {string} token - The name of the channel.
 * @property {boolean} online - Indicates if the channel is streaming.
 * @property {boolean} featured - True if featureLevel is > 0
 * @property {number} featureLevel - The featured level for this channel. Its value controls the position and order of channels in the featured carousel.
 * @property {boolean} partnered - Indicates if the channel is partnered.
 * @property {boolean} suspended - Indicates if the channel is suspended.
 * @property {string} name - The title of the channel.
 * @property {string} audience - The target audience of the channel.
 * @property {number} typeId - The ID of the Mixer channel type (ie a game or category a channel can be set to)
 * @property {number} viewersTotal - Amount of unique viewers that ever viewed this channel.
 * @property {number} viewersCurrent - Amount of current viewers.
 * @property {number} numFollowers - Amount of followers.
 * @property {boolean} interactive - Indicates if that channel is interactive.
 * @property {string} [costreamId] - The id of the costream that the channel is in, if any.
 */

/**
 * @typedef {Object} MixerChannelAdvanced
 * @property {import('./types').MixerChannelType} [type] - A nested type showing information about this channel's currently selected type.
 * @property {import('./users').MixerUserSimple} user - This channel's owner.
 */

/** A single channel within Mixer. Each channel is owned by a user, and a channel can be broadcasted to.
  * @typedef {MixerChannelSimple & MixerChannelAdvanced} MixerChannel
  */

/**
 * @typedef { "Banned" | "Mod" } BannedOrModRole
 */

/**
  * @typedef {Object} MixerBroadcast
  * @property {string} id - Unique ID for this broadcast.
  * @property {number} channelId - ID of the Channel this broadcast belongs to.
  * @property {boolean} online - True if this broadcast is online and in progress.
  * @property {boolean} isTestStream - True if this broadcast is running in test stream mode.
  * @property {Date} startedAt - The date that this broadcast started at.
  */

/**
 * Gets a single channel.
 * @argument {number|string} channelIdOrToken - The ID or token of the channel.
 * @return {Promise<MixerChannel>}
 */
exports.getChannel = async channelIdOrToken => {
    try {
        /**@type {Mixer.IResponse<MixerChannel>} */
        const response = await mixerClient.streamer.request("get", `channels/${channelIdOrToken}`);
        return response.body;
    } catch (error) {
        return null;
    }
};

/**
 * Gets the Streamers channel.
 */
exports.getStreamersChannel = async () => {
    const streamerChannelId = accountAccess.getAccounts().streamer.channelId;
    return exports.getChannel(streamerChannelId);
};

/**
 * Updates the Streamers channel.
 * @argument {MixerChannelSimple} channelProperties - properties of the channel to update.
 * @return {Promise<MixerChannelSimple>} - The updated channel
 */
exports.updateStreamersChannel = async channelProperties => {
    const streamerChannelId = accountAccess.getAccounts().streamer.channelId;
    try {
        /**@type {Mixer.IResponse<MixerChannelSimple>} */
        const response = await mixerClient.streamer.request("patch", `channels/${streamerChannelId}`, {
            body: channelProperties
        });
        return response.body;
    } catch (error) {
        return null;
    }
};

/**
 * Updates a user's roles on the Streamers channel. This can be used to make a user a moderator or to ban them.
 * @argument {number} userId - The ID the user to update the roles for.
 * @argument {BannedOrModRole[]} rolesToAdd - List of groups to add the user to.
 * @argument {BannedOrModRole[]} rolesToRemove - List of groups to remove the user from.
 * @return {Promise<void>}
 */
exports.updateUserRoles = async (userId, rolesToAdd, rolesToRemove) => {
    const streamerChannelId = accountAccess.getAccounts().streamer.channelId;
    try {
        await mixerClient.streamer.request("patch", `channels/${streamerChannelId}/users/${userId}`, {
            body: {
                add: rolesToAdd || [],
                remove: rolesToRemove || []
            }
        });
    } catch (error) {
        logger.error('failed to update users roles', error);
        return;
    }
};

/**
 * Returns the latest/ongoing broadcast on the Streamers channel, null if not streaming
 * @return {Promise<MixerBroadcast>}
 */
exports.getStreamersBroadcast = async () => {
    const streamerChannelId = accountAccess.getAccounts().streamer.channelId;
    try {
        /**@type {Mixer.IResponse<MixerBroadcast>} */
        const response = await mixerClient.streamer.request("get", `channels/${streamerChannelId}/broadcast`);
        return response.body;
    } catch (error) {
        return null;
    }
};
