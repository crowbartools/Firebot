import logger from '../../logwrapper';
import accountAccess from "../../common/account-access";
import { ApiClient } from "@twurple/api";

export class TwitchSubscriptionsApi {
    private _streamerClient: ApiClient;
    private _botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this._streamerClient = streamerClient;
        this._botClient = botClient;
    }

    /**
     * Retrieves the number of subscribers the streamer has
     *
     * @returns Number of subscribers the streamer has
     */
    async getSubscriberCount(): Promise<number> {
        try {
            const streamerId = accountAccess.getAccounts().streamer.userId;
            const subscriberInfo = await this._streamerClient.subscriptions.getSubscriptions(streamerId);

            return subscriberInfo.total;
        } catch (error) {
            logger.error("Error getting channel subscriber count", error.message);
            return 0;
        }
    }

    /**
     * Retrieves the number of sub points the streamer has
     *
     * @returns Number of sub points the streamer has
     */
    async getSubPointCount(): Promise<number> {
        try {
            const streamerId = accountAccess.getAccounts().streamer.userId;
            const subscriberInfo = await this._streamerClient.subscriptions.getSubscriptions(streamerId);

            return subscriberInfo.points;
        } catch (error) {
            logger.error("Error getting channel sub point count", error.message);
            return 0;
        }
    }
}