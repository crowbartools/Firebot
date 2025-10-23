import { HelixHypeTrainEvent } from "@twurple/api";
import { ApiResourceBase } from './api-resource-base';
import type { TwitchApi } from "../";

export class TwitchHypeTrainApi extends ApiResourceBase {
    constructor(apiBase: typeof TwitchApi) {
        super(apiBase);
    }

    /**
     * Retrieves recent Twitch channel hypetrain events for the streamer
     */
    async getRecentHypeTrainEvents(): Promise<HelixHypeTrainEvent[]> {
        try {
            const streamerId = this.accounts.streamer.userId;

            const goals = await this.streamerClient.hypeTrain.getHypeTrainEventsForBroadcaster(streamerId);

            return goals.data;
        } catch (error) {
            this.logger.error(`Failed to get current hype train events: ${(error as Error).message}`);
            return null;
        }
    }
}