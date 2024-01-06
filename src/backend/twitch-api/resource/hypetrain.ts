import logger from '../../logwrapper';
import accountAccess from "../../common/account-access";
import { ApiClient, HelixHypeTrainEvent } from "@twurple/api";

export class TwitchHypeTrainApi {
    private _streamerClient: ApiClient;
    private _botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this._streamerClient = streamerClient;
        this._botClient = botClient;
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