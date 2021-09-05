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

function mapTwitchTag(tag) {
    return {
        id: tag.tag_id,
        isAuto: tag.is_auto,
        name: tag.localization_names["en-us"],
        description: tag.localization_descriptions["en-us"]
    };
}

async function getAllStreamTags(cursor) {
    const client = twitchApi.getClient();

    try {
        let response = {};

        if (cursor == null) {
            response = await client.callApi({
                type: TwitchAPICallType.Helix,
                url: "tags/streams"
            });
        } else {
            response = await client.callApi({
                type: TwitchAPICallType.Helix,
                url: "tags/streams",
                query: {
                    after: cursor
                }
            });
        }

        if (response == null || response.data == null || response.data.length < 1) {
            return null;
        }

        return response;
    } catch (error) {
        logger.error("Failed to get all stream tags", error);
        return null;
    }
}

async function getAllStreamTagsPaginated() {
    let response = await getAllStreamTags();
    let cursor = "";
    let streamTags = response.data;

    while (response.pagination.cursor && response.pagination.cursor !== cursor) {
        cursor = response.pagination.cursor;
        response = await getAllStreamTags(cursor);
        if (response == null) break;

        streamTags = streamTags.concat(response.data.filter(tag => !tag.is_auto));
    }

    /**@type {TwitchStreamTag[]} */
    return streamTags.map(tag => mapTwitchTag(tag));
}

async function getChannelStreamTags() {
    const client = twitchApi.getClient();

    try {
        const response = await client.callApi({
            type: TwitchAPICallType.Helix,
            url: "streams/tags",
            method: "GET",
            query: {
                "broadcaster_id": accountAccess.getAccounts().streamer.userId
            }
        });

        if (response == null || response.data == null || response.data.length < 1) {
            return null;
        }

        /**@type {TwitchStreamTag[]} */
        return response.data.filter(tag => !tag.is_auto).map(tag => mapTwitchTag(tag));
    } catch (error) {
        logger.error("Failed to get channel stream tags", error);
        return null;
    }
}

async function updateChannelStreamTags(tagIds) {
    const client = twitchApi.getClient();
    try {
        await client.callApi({
            type: TwitchAPICallType.Helix,
            url: "streams/tags",
            method: "PUT",
            query: {
                "broadcaster_id": accountAccess.getAccounts().streamer.userId
            },
            body: snakeKeys(tagIds)
        });
        return true;
    } catch (error) {
        logger.error("Failed to update channel stream tags", error);
        return false;
    }
}

exports.getAllStreamTagsPaginated = getAllStreamTagsPaginated;
exports.getChannelStreamTags = getChannelStreamTags;
exports.updateChannelStreamTags = updateChannelStreamTags;