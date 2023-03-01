import logger from "../../logwrapper";
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

export class TwitchCategoriesApi {
    streamerClient: ApiClient;
    botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this.streamerClient = streamerClient;
        this.botClient = botClient;
    }

    private mapTwitchCategory(category: HelixGame, size?: string): TwitchCategory {
        return {
            id: category.id,
            name: category.name,
            boxArtUrl: category.boxArtUrl.replace("{width}x{height}", size)
        };
    }

    async getCategoryById(categoryId: string, size = "285x380"): Promise<TwitchCategory> {
        try {
            const category = await this.streamerClient.games.getGameById(categoryId);
            if (category == null) {
                return null;
            }
            return this.mapTwitchCategory(category, size);
        } catch (error) {
            logger.error("Failed to get twitch category", error);
            return null;
        }
    }

    async searchCategories(categoryName: string): Promise<TwitchCategory[]> {
        let categories: HelixGame[] = [];
    
        try {
            const response = await this.streamerClient.search.searchCategories(categoryName);
            if (response && response.data) {
                categories = response.data;
            }
        } catch (error) {
            logger.error("Failed to search Twitch categories", error);
        }
    
        return categories.map(c => this.mapTwitchCategory(c));
    }
};