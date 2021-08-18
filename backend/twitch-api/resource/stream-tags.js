"use strict";

const twitchApi = require("../client");
const { TwitchAPICallType } = require('twitch/lib');
const accountAccess = require("../../common/account-access");
const logger = require('../../logwrapper');

/**
 * @typedef TwitchStreamTag
 * @property {string} tag_id - The ID of this tag
 * @property {boolean} is_auto - Whether this tag is automatically applied for a category
 * @property {object} name - A dictionary that contains the localized names of the tag
 * @property {object} description - A dictionary that contains the localized descriptions of the tag
 */

function mapTwitchTag(tag) {
	return {
		id: tag.tag_id,
		isAuto: tag.is_auto,
		name: tag.localization_names["en-us"],
		description: tag.localization_descriptions["en-us"]
	}
}

async function getAllStreamTags() {
	const client = twitchApi.getClient();

	try {
		const response = await client.callApi({
            type: TwitchAPICallType.Helix,
            url: "tags/streams"
        });

		if (response == null || response.data == null || response.data.length < 1) {
            return null;
        }

		/**@type {TwitchStreamTag[]} */
        return response.data.map(tag => mapTwitchTag(tag));
	} catch (err) {
		logger.error("Failed to get all stream tags", error);
        return null;
	}
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
		return response.data.map(tag => mapTwitchTag(tag));
	} catch (err) {
		logger.error("Failed to get channel stream tags", err);
        return null;
	}
}

function updateChannelStreamTags(tagIds) {
	const client = twitchApi.getClient();
    try {
        await client.callApi({
            type: TwitchAPICallType.Helix,
            url: "streams/tags",
            method: "PUT",
            query: {
                "broadcaster_id": accountAccess.getAccounts().streamer.userId
            },
            body: { tag_ids: tagIds }
        });
        return true;
    } catch (err) {
        logger.error("Failed to update channel stream tags", err);
        return false;
    }
}

exports.getAllStreamTags = getAllStreamTags;
exports.getChannelStreamTags = getChannelStreamTags;
exports.updateChannelStreamTags = updateChannelStreamTags;