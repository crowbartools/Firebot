import logger from '../../logwrapper';
import accountAccess from "../../common/account-access";
import { ApiClient } from "@twurple/api";

export class TwitchStreamsApi {
    client: ApiClient;

    constructor(apiClient: ApiClient) {
        this.client = apiClient;
    }

    async createStreamMarker(descriotion?: string): Promise<void> {
        try {
            const streamerId = accountAccess.getAccounts().streamer.userId;

            await this.client.streams.createStreamMarker(streamerId, descriotion);
        } catch (error) {
            logger.error(`Failed to create stream marker`, error);
        }
    }
};