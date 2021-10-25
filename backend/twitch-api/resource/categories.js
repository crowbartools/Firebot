"use strict";

const logger = require("../../logwrapper");
const twitchApi = require("../api");

/**
 * @typedef TwitchCategory
 * @property {string} id - The ID of this category
 * @property {string} name - The name of this category
 * @property {string} boxArtUrl - The box art or cover image url of this category
 */


/**
 * @param {import("@twurple/api").HelixGame} category
 * @param {string} size
 * @returns {TwitchCategory}
 * */
const mapTwitchCategory = (category, size) => {
    const mappedCategory = {
        id: category.id,
        name: category.name,
        boxArtUrl: ""
    };
    if (category.box_art_url) {
        mappedCategory.boxArtUrl = category.box_art_url.replace("{width}x{height}", size);
    } else {
        mappedCategory.boxArtUrl = category.boxArtUrl.replace("{width}x{height}", size);
    }
    return mappedCategory;
};

/**
 * @param {string} categoryId
 * @param {string} [size]
 * @returns {Promise.<TwitchCategory>}
 */
const getCategoryById = async (categoryId, size = "285x380") => {
    const client = twitchApi.getClient();
    try {
        const category = await client.games.getGameById(categoryId);
        if (category == null) return null;
        return mapTwitchCategory(category, size);
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
    let categories = [];

    try {
        const response = await client.search.searchCategories(categoryName);
        if (response && response.data) {
            categories = response.data;
        }
    } catch (err) {
        logger.error("Failed to search twitch categories", err);
    }

    return categories.map(c => mapTwitchCategory(c));
};

exports.getCategoryById = getCategoryById;
exports.searchCategories = searchCategories;