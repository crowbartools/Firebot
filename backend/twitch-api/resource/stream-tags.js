"use strict";

const twitchApi = require("../api");
const accountAccess = require("../../common/account-access");
const logger = require('../../logwrapper');

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
        const response = await client.tags.getAllStreamTagsPaginated().getAll();

        if (response) {
            /**@type {TwitchStreamTag[]} */
            return response.filter(tag => !tag.isAuto).map(tag => mapTwitchTag(tag));
        }
    } catch (error) {
        logger.error("Failed to get all stream tags", error);
        return [];
    }
};

const getChannelStreamTags = async () => {
    try {
        const client = twitchApi.getClient();
        const response = await client.streams.getStreamTags(accountAccess.getAccounts().streamer.userId);

        if (response) {
            /**@type {TwitchStreamTag[]} */
            return response.filter(tag => !tag.isAuto).map(tag => mapTwitchTag(tag));
        }
    } catch (error) {
        logger.error("Failed to get channel stream tags", error);
        return [];
    }
};

const updateChannelStreamTags = async (tagIds) => {
    try {
        const client = twitchApi.getClient();
        await client.streams.replaceStreamTags(accountAccess.getAccounts().streamer.userId, tagIds);
    } catch (error) {
        logger.error("Failed to update channel stream tags", error);
    }
};

exports.getAllStreamTags = getAllStreamTags;
exports.getChannelStreamTags = getChannelStreamTags;
exports.updateChannelStreamTags = updateChannelStreamTags;