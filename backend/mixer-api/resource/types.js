"use strict";

const Mixer = require("@mixer/client-node");
const mixerClient = require("../client");

/**
 * A Mixer Channel type (ie a game or category a channel can be set to)
 * @typedef {Object} MixerChannelType
 * @property {string} id - The type ID
 * @property {string} [name] - Name for the type
 * @property {string} parent - The parent of the type
 * @property {string} [description] - A text description of the type
 * @property {string} [coverUrl] - URL to cover picture
 * @property {string} [backgroundUrl] - URL to background picture
 * @property {number} viewersCurrent - The current number of viewers for the type
 */

/**
 * Gets the information for a particular Channel type.
 * @argument {string} typeId - The unique ID of the type
 * @return {Promise<MixerChannelType>}
 */
exports.getChannelType = async (typeId) => {
    try {
        /**@type {Mixer.IResponse<MixerChannelType>} */
        const response = await mixerClient.streamer.request("get", `types/${typeId}`);
        return response.body;
    } catch (error) {
        return null;
    }
};

/**
 * List available channel types
 * @argument {string} query - The unique ID of the type
 * @return {Promise<MixerChannelType[]>}
 */
exports.searchChannelTypes = async (query = "") => {
    try {
        /**@type {Mixer.IResponse<MixerChannelType>} */
        const response = await mixerClient.streamer.request("get", `types?query=${query}`);
        return response.body;
    } catch (error) {
        return [];
    }
};
