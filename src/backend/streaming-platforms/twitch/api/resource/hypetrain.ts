import { HelixHypeTrain } from "@twurple/api";
import { ApiResourceBase } from './api-resource-base';
import type { TwitchApi } from "../";

export class TwitchHypeTrainApi extends ApiResourceBase {
    constructor(apiBase: typeof TwitchApi) {
        super(apiBase);
    }

    /**
     * Retrieves current Twitch channel hype train for the streamer
     */
    async getCurrentHypeTrain(): Promise<HelixHypeTrain> {
        try {
            const streamerId = this.accounts.streamer.userId;

            const status = await this.streamerClient.hypeTrain.getHypeTrainStatusForBroadcaster(streamerId);

            return status.current;
        } catch (error) {
            this.logger.error(`Failed to get current hype train: ${(error as Error).message}`);
            return null;
        }
    }
}