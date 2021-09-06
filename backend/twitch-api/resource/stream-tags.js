"use strict";

const twitchApi = require("../client");
const { TwitchAPICallType } = require('twitch/lib');
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
        const response = await client.helix.tags.getAllStreamTagsPaginated().getAll();

        if (response) {
            /**@type {TwitchStreamTag[]} */
            return response.filter(tag => !tag.isAuto).map(tag => mapTwitchTag(tag));
        }
    } catch (error) {
        logger.error("Failed to get all stream tags", error);
        return null;
    }
};

const getChannelStreamTags = async () => {
    try {
        const client = twitchApi.getClient();
        const response = await client.helix.streams.getStreamTags(accountAccess.getAccounts().streamer.userId);

        if (response) {
            /**@type {TwitchStreamTag[]} */
            return response.filter(tag => !tag.isAuto).map(tag => mapTwitchTag(tag));
        }
    } catch (error) {
        logger.error("Failed to get channel stream tags", error);
        return null;
    }
};

//TODO: update to package method when package patch is released
const updateChannelStreamTags = async (tagIds) => {
    try {
        const client = twitchApi.getClient();
        await client.callApi({
            type: TwitchAPICallType.Helix,
            url: "streams/tags",
            method: "PUT",
            query: {
                "broadcaster_id": accountAccess.getAccounts().streamer.userId
            },
            body: snakeKeys(tagIds)
        });
    } catch (error) {
        logger.error("Failed to update channel stream tags", error);
        return false;
    }
};

exports.getAllStreamTags = getAllStreamTags;
exports.getChannelStreamTags = getChannelStreamTags;
exports.updateChannelStreamTags = updateChannelStreamTags;