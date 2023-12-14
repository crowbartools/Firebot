import logger from '../../logwrapper';
import accountAccess from "../../common/account-access";
import { ApiClient } from "@twurple/api";

export class TwitchAuthApi {
    streamerClient: ApiClient;
    botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this.streamerClient = streamerClient;
        this.botClient = botClient;
    }

    async isTokenValid(type: "streamer" | "bot"): Promise<boolean> {
        try {
            let userId: string, apiClient: ApiClient;

            switch (type) {
                case "streamer":
                    userId = accountAccess.getAccounts().streamer.userId;
                    apiClient = this.streamerClient;
                    break;
            
                case "bot":
                    userId = accountAccess.getAccounts().bot.userId;
                    apiClient = this.botClient;
                    break;
            }

            // This shouldn only happen if an account is not logged in
            if (!userId || !apiClient) return false;

            const token = await apiClient.getTokenInfo();
            return token?.userId === userId;
        } catch (error) {
            logger.error(`Failed to validate token`, error.message);
            return false;
        }
    }
};