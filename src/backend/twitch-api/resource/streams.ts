import logger from '../../logwrapper';
import accountAccess from "../../common/account-access";
import { ApiClient } from "@twurple/api";

export class TwitchStreamsApi {
    streamerClient: ApiClient;
    botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this.streamerClient = streamerClient;
        this.botClient = botClient;
    }

    async createStreamMarker(descriotion?: string): Promise<void> {
        try {
            const streamerId = accountAccess.getAccounts().streamer.userId;

            await this.streamerClient.streams.createStreamMarker(streamerId, descriotion);
        } catch (error) {
            logger.error(`Failed to create stream marker`, error);
        }
    }
};