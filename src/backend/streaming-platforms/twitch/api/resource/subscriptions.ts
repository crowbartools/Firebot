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
        const subscriptions: HelixSubscription[] = [];

        try {
            const streamerId = this.accounts.streamer.userId;
            if (streamerId == null) {
                this.logger.warn("Unable to get channel subscriptions. Streamer is not logged in.");
                return subscriptions;
            }

            subscriptions.push(...await this.streamerClient.subscriptions.getSubscriptionsPaginated(streamerId).getAll());
        } catch (error) {
            this.logger.error(`Error getting subscriptions: ${(error as Error).message}`);
        }

        return subscriptions;
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