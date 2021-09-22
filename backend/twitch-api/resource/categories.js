"use strict";

const logger = require("../../logwrapper");
const twitchApi = require("../api");

/**
 * @typedef TwitchCategory
 * @property {string} id - The ID of this category
 * @property {string} name - The name of this category
 * @property {string} boxArtUrl - The box art or cover image url of this category
 */

/** @returns {TwitchCategory} */
const mapTwitchCategory = (category, size) => {
    return {
        id: category.id,
        name: category.name,
        boxArtUrl: category.boxArtUrl.replace("{width}x{height}", size)
    };
};

/**
 * @param {number} categoryId
 * @param {string} [size]
 * @returns {Promise.<TwitchCategory>}
 */
const getCategoryById = async (categoryId, size = "285x380") => {
    const client = twitchApi.getClient();
    try {
        const category = await client.games.getGameById(categoryId);
        if (category) {
            return mapTwitchCategory(category, size);
        }

        return null;
    } catch (error) {
        logger.error("Failed to get twitch category", error);
        return null;
    }
};

/**
 * @param {string} categoryName
 * @returns {Promise.<TwitchCategory[]>}
 */
const searchCategories = async (categoryName) => {
    const client = twitchApi.getClient();

    try {
        const response = await client.search.searchCategories(categoryName);
        if (response && response.data) {
            return response.data.map(c => mapTwitchCategory(c));
        }

        return null;
    } catch (err) {
        logger.error("Failed to search twitch categories", err);
    }
};

exports.getCategoryById = getCategoryById;
exports.searchCategories = searchCategories;