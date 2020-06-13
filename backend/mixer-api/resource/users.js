"use strict";

const Mixer = require("@mixer/client-node");
const mixerClient = require("../client");

/**
 * A user is a person on Mixer; they can sign in and interact with the site. Each user owns a channel, which they can broadcast to.
 * @typedef {Object} MixerUserSimple
 * @property {number} id - The unique ID of the user.
 * @property {number} level - The user's current level on Mixer, as determined by the number of experience points the user has.
 * @property {string} username - The user's name. This is unique on the site and is also their channel name. (Min length 1, max length: 20)
 * @property {number} experience - The user's experience points.
 * @property {number} sparks - The amount of sparks the user has.
 * @property {string} [avatarUrl] - The user's profile picture URL.
 * @property {MixerUserGroup[]} [groups] - The groups of the user.
 */

/**
 * @typedef {Object} MixerUserAdvanced
 * @property {import('./channels').MixerChannelSimple} channel - The user's channel.
 */

/** A user is a person on Mixer; they can sign in and interact with the site. Each user owns a channel, which they can broadcast to.
  * @typedef {MixerUserSimple & MixerUserAdvanced} MixerUser
  */

/**
 * A Group (aka role) which a user can belong to can control features or access controls throughout Mixer.
 * @typedef {Object} MixerUserGroup
 * @property {number} id - The unique ID of the group.
 * @property {RoleName} role - The name of the group.
 */

/**
 * @typedef { "User" | "Banned" | "Pro" | "VerifiedPartner" | "Partner" | "Subscriber" | "ChannelEditor" | "Mod" | "GlobalMod" | "Staff" | "Founder" | "Owner" } RoleName
 */

/**
 * Gets a single channel.
 * @argument {number} userId - The ID of the user.
 * @return {Promise<MixerUser>}
 */
exports.getUser = async (userId) => {
    try {
        /**@type {Mixer.IResponse<MixerUser>} */
        const response = await mixerClient.streamer.request("get", `users/${userId}`);
        return response.body;
    } catch (error) {
        return null;
    }
};

/**
 * Retrieves the currently authenticated user.
 * @return {Promise<MixerUser>}
 */
exports.getCurrentUser = async () => {
    try {
        /**@type {Mixer.IResponse<MixerUser>} */
        const response = await mixerClient.streamer.request("get", `users/current`);
        return response.body;
    } catch (error) {
        return null;
    }
};
