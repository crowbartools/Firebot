import logger from "../../logwrapper";
import twitchApi from "../api";
import { ApiClient, HelixGame } from "@twurple/api";

/**
 * Defines a Twitch category
 */
export interface TwitchCategory {
    /** The Twitch ID of the category */
    id: string,

    /** The name of the category */
    name: string,

    /** The box art or cover image URL of the category */
    boxArtUrl: string
};


/**
 * @param {import("@twurple/api").HelixGame} category
 * @param {string} size
 * @returns {TwitchCategory}
 * */
function mapTwitchCategory(category: HelixGame, size?: string): TwitchCategory {
    return {
        id: category.id,
        name: category.name,
        boxArtUrl: category.boxArtUrl.replace("{width}x{height}", size)
    };
};

/**
 * @param {string} categoryId
 * @param {string} [size]
 * @returns {Promise.<TwitchCategory>}
 */
export async function getCategoryById(categoryId: string, size = "285x380"): Promise<TwitchCategory> {
    const client = twitchApi.getClient();
    try {
        const category = await client.games.getGameById(categoryId);
        if (category == null) {
            return null;
        }
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
export async function searchCategories(categoryName: string): Promise<TwitchCategory[]> {
    const client: ApiClient = twitchApi.getClient();
    let categories: HelixGame[] = [];

    try {
        const response = await client.search.searchCategories(categoryName);
        if (response && response.data) {
            categories = response.data;
        }
    } catch (error) {
        logger.error("Failed to search Twitch categories", error);
    }

    return categories.map(c => mapTwitchCategory(c));
};