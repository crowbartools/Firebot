import logger from '../../logwrapper';
import accountAccess from "../../common/account-access";
import { ApiClient } from "@twurple/api";

export class TwitchStreamsApi {
    private _streamerClient: ApiClient;
    private _botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this._streamerClient = streamerClient;
        this._botClient = botClient;
    }

    async createStreamMarker(description?: string): Promise<void> {
        try {
            const streamerId = accountAccess.getAccounts().streamer.userId;

            await this._streamerClient.streams.createStreamMarker(streamerId, description);
        } catch (error) {
            logger.error(`Failed to create stream marker`, error.message);
        }
    }
}