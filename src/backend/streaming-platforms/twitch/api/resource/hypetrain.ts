import { ApiClient, HelixHypeTrainEvent } from "@twurple/api";
import { ApiResourceBase } from './api-resource-base';
import logger from '../../../../logwrapper';
import accountAccess from "../../../../common/account-access";

export class TwitchHypeTrainApi extends ApiResourceBase {
    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        super(streamerClient, botClient);
    }

    /**
     * Retrieves recent Twitch channel hypetrain events for the streamer
     */
    async getRecentHypeTrainEvents(): Promise<HelixHypeTrainEvent[]> {
        try {
            const streamerId = accountAccess.getAccounts().streamer.userId;

            const goals = await this._streamerClient.hypeTrain.getHypeTrainEventsForBroadcaster(streamerId);

            return goals.data;
        } catch (error) {
            logger.error("Failed to get current hypetrain events", error.message);
            return null;
        }
    }
}