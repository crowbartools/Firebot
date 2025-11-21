import { HelixGame } from "@twurple/api";
import { ApiResourceBase } from "./api-resource-base";
import type { TwitchApi } from "../";

/**
 * Defines a Twitch category
 */
export interface TwitchCategory {
    /** The Twitch ID of the category */
    id: string;

    /** The name of the category */
    name: string;

    /** The box art or cover image URL of the category */
    boxArtUrl: string;
}

export class TwitchCategoriesApi extends ApiResourceBase {
    constructor(apiBase: typeof TwitchApi) {
        super(apiBase);
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
            this.logger.error(`Failed to get Twitch category: ${(error as Error).message}`);
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
            this.logger.error(`Failed to search Twitch categories: ${(error as Error).message}`);
        }

        return categories.map(c => this.mapTwitchCategory(c));
    }
}