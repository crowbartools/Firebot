import { ApiClient } from "@twurple/api";
import { ApiResourceBase } from './api-resource-base';
import type { TwitchApi } from "../";

export class TwitchAuthApi extends ApiResourceBase {
    constructor(apiBase: typeof TwitchApi) {
        super(apiBase);
    }

    async isTokenValid(type: "streamer" | "bot"): Promise<boolean> {
        try {
            let userId: string, apiClient: ApiClient;

            switch (type) {
                case "streamer":
                    userId = this.accounts.streamer.userId;
                    apiClient = this.streamerClient;
                    break;

                case "bot":
                    userId = this.accounts.bot.userId;
                    apiClient = this.botClient;
                    break;
            }

            // This should only happen if an account is not logged in
            if (!userId || !apiClient) {
                return false;
            }

            const token = await apiClient.getTokenInfo();
            return token?.userId === userId;
        } catch (error) {
            this.logger.error(`Failed to validate token`, (error as Error).message);
            return false;
        }
    }
}