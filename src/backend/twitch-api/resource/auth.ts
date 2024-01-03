import logger from '../../logwrapper';
import accountAccess from "../../common/account-access";
import { ApiClient } from "@twurple/api";

export class TwitchAuthApi {
    private _streamerClient: ApiClient;
    private _botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this._streamerClient = streamerClient;
        this._botClient = botClient;
    }

    async isTokenValid(type: "streamer" | "bot"): Promise<boolean> {
        try {
            let userId: string, apiClient: ApiClient;

            switch (type) {
                case "streamer":
                    userId = accountAccess.getAccounts().streamer.userId;
                    apiClient = this._streamerClient;
                    break;

                case "bot":
                    userId = accountAccess.getAccounts().bot.userId;
                    apiClient = this._botClient;
                    break;
            }

            // This should only happen if an account is not logged in
            if (!userId || !apiClient) {
                return false;
            }

            const token = await apiClient.getTokenInfo();
            return token?.userId === userId;
        } catch (error) {
            logger.error(`Failed to validate token`, error.message);
            return false;
        }
    }
}