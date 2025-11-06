import { ApiResourceBase } from './api-resource-base';
import type { TwitchApi } from "../";
import { HelixSubscription } from '@twurple/api/lib';

export class TwitchSubscriptionsApi extends ApiResourceBase {
    constructor(apiBase: typeof TwitchApi) {
        super(apiBase);
    }

    /**
     * Retrieves the subscription info for all users who are currently subscribed to the streamer
     *
     * @returns {HelixSubscription[]}
     */
    async getSubscriptions(): Promise<HelixSubscription[]> {
        const streamerId = this.accounts.streamer.userId;
        const subscriberInfo = await this.streamerClient.subscriptions.getSubscriptionsPaginated(streamerId).getAll();

        return subscriberInfo;
    }

    /**
     * Retrieves the number of subscribers the streamer has
     *
     * @returns Number of subscribers the streamer has
     */
    async getSubscriberCount(): Promise<number> {
        try {
            const streamerId = this.accounts.streamer.userId;
            const subscriberInfo = await this.streamerClient.subscriptions.getSubscriptions(streamerId);

            return subscriberInfo.total;
        } catch (error) {
            this.logger.error(`Error getting channel subscriber count: ${(error as Error).message}`);
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
            const streamerId = this.accounts.streamer.userId;
            const subscriberInfo = await this.streamerClient.subscriptions.getSubscriptions(streamerId);

            return subscriberInfo.points;
        } catch (error) {
            this.logger.error(`Error getting channel sub point count: ${(error as Error).message}`);
            return 0;
        }
    }
}