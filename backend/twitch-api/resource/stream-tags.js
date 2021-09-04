"use strict";

const twitchApi = require("../client");
const accountAccess = require("../../common/account-access");
const logger = require('../../logwrapper');
const { snakeKeys } = require('js-convert-case');

/**
 * @typedef TwitchStreamTag
 * @property {string} id - The ID of this tag
 * @property {boolean} isAuto - Whether this tag is automatically applied to the channel
 * @property {string} name - A dictionary that contains the localized names of the tag
 * @property {string} description - A dictionary that contains the localized descriptions of the tag
 */

const mapTwitchTag = (tag) => {
    return {
        id: tag.id,
        isAuto: tag.isAuto,
        name: tag.getName("en-us"),
        description: tag.getDescription("en-us")
    };
};

const getAllStreamTags = async () => {
    try {
        const client = twitchApi.getClient();
        const response = await client.helix.tags.getAllStreamTagsPaginated();
        /**@type {TwitchStreamTag[]} */
        return response.map(tag => mapTwitchTag(tag));
    } catch (error) {
        logger.debug("Couldn't retrieve all stream tags");
    }
};

const getChannelStreamTags = async () => {
    const client = twitchApi.getClient();

    try {
        const response = await client.helix.streams.getStreamTags(accountAccess.getAccounts().streamer.userId);

        if (response == null || response.data == null || response.data.length < 1) {
            return null;
        }

        /**@type {TwitchStreamTag[]} */
        return response.data.filter(tag => !tag.is_auto).map(tag => mapTwitchTag(tag));
    } catch (error) {
        logger.error("Failed to get channel stream tags", error);
        return null;
    }
};

const updateChannelStreamTags = async (tagIds) => {
    const client = twitchApi.getClient();
    try {
        await client.helix.streams.replaceStreamTags(accountAccess.getAccounts().streamer.userId, snakeKeys(tagIds));
        return true;
    } catch (error) {
        logger.error("Failed to update channel stream tags", error);
        return false;
    }
};

exports.getAllStreamTags = getAllStreamTags;
exports.getChannelStreamTags = getChannelStreamTags;
exports.updateChannelStreamTags = updateChannelStreamTags;