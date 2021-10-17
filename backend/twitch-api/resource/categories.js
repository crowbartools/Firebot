"use strict";

const logger = require("../../logwrapper");
const twitchApi = require("../api");
const { TwitchAPICallType } = require("twitch/lib");

/**
 * @typedef TwitchCategory
 * @property {string} id - The ID of this category
 * @property {string} name - The name of this category
 * @property {string} boxArtUrl - The box art or cover image url of this category
 */


function mapTwitchCategory(category, size) {
    if (category.box_art_url) {
        category.boxArtUrl = category.box_art_url.replace("{width}x{height}", size);
    }
    return category;
}

/**
 * @param {number} categoryId
 * @param {string} [size]
 * @returns {Promise.<TwitchCategory>}
 */
async function getCategoryById(categoryId, size = "285x380") {
    const client = twitchApi.getClient();
    try {
        const category = await client.helix.games.getGameById(categoryId);
        if (category == null) return null;
        return mapTwitchCategory(category._data, size);
    } catch (error) {
        logger.error("Failed to get twitch category", error);
        return null;
    }
}

/**
 * @param {string} categoryName
 * @returns {Promise.<TwitchCategory[]>}
 */
async function searchCategories(categoryName) {
    const client = twitchApi.getClient();
    let categories = [];
    try {
        const response = await client.callApi({
            type: TwitchAPICallType.Helix,
            url: "search/categories",
            query: {
                query: categoryName,
                first: 10
            }
        });
        if (response && response.data) {
            categories = response.data;
        }
    } catch (err) {
        logger.error("Failed to search twitch categories", err);
    }
    return categories.map(c => mapTwitchCategory(c));
}

exports.getCategoryById = getCategoryById;
exports.searchCategories = searchCategories;