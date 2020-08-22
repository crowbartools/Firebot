"use strict";

const mixerClient = require("../client");
const accountAccess = require("../../common/account-access");

/**
 * A user is a person on Mixer; they can sign in and interact with the site. Each user owns a channel, which they can broadcast to.
 * @typedef {Object} MixerChatUser
 * @property {number} userId - The unique ID of the user.
 * @property {string} username - The user's name. This is unique on the site and is also their channel name. (Min length 1, max length: 20)
 * @property {number} experience - The user's experience points.
 * @property {import('./users').RoleName[]} userRoles - The groups of the user.
 * @property {Object} user - User properties
 * @property {number} user.level - The user's level.
 * @property {number} user.experience - The user's experience points.
 */

/**
 * @typedef {Object} MessageSegment
 * @property {"text"|"emoticon"|"link"|"tag"|"image"} type - The type of the segment
 * @property {string} text - The raw text of the segment
 */

/**
 * @typedef {Object} MessageSegment
 * @property {"text"|"emoticon"|"link"|"tag"|"image"} type - The type of the segment
 * @property {string} text - The raw text of the segment
 */

/**
 * A user is a person on Mixer; they can sign in and interact with the site. Each user owns a channel, which they can broadcast to.
 * @typedef {Object} MixerChatEvent
 * @property {number} channel - The channel ID the message was sent to.
 * @property {string} id - The ID of the message.
 * @property {number} user_id - The user ID of who sent the message.
 * @property {import('./users').RoleName[]} user_roles - The roles of the user.
 * @property {number} user_level - The user's level.
 * @property {number} user_ascension_level - The user's level.
 * @property {string} [user_avatar] - The user's avatar, null if not set.
 * @property {Object} message - The message object
 * @property {MessageSegment[]} message.message - Array of message segments
 * @property {Object} message.meta - Metadata for the message
 */

/**
 * Retrieves a single chat user by user ID.
 * @argument {number} userId - The ID of the user in chat
 * @return {Promise<MixerChatUser>}
 */
exports.getUserInChat = async userId => {
    const streamerChannelId = accountAccess.getAccounts().streamer.channelId;
    try {
        /**@type {import('@mixer/client-node').IResponse<MixerChatUser>} */
        const response = await mixerClient.streamer.request("get", `chats/${streamerChannelId}/users/${userId}`);
        return response.body;
    } catch (error) {
        return null;
    }
};

/**
 * Returns the most recent chat messages for the channel
 * @return {Promise<MixerChatEvent[]>}
 */
exports.getHistory = async () => {
    const streamerChannelId = accountAccess.getAccounts().streamer.channelId;
    try {
        /**@type {import('@mixer/client-node').IResponse<MixerChatEvent[]>} */
        const response = await mixerClient.streamer.request("get", `chats/${streamerChannelId}/history`);
        return response.body;
    } catch (error) {
        return [];
    }
};
