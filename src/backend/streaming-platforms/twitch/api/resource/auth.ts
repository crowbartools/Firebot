import { ApiClient } from "@twurple/api";
import { ApiResourceBase } from './api-resource-base';
import logger from '../../../../logwrapper';
import accountAccess from "../../../../common/account-access";

export class TwitchAuthApi extends ApiResourceBase {
    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        super(streamerClient, botClient);
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