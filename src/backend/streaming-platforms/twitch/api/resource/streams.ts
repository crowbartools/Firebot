import { ApiClient, HelixStream, HelixStreamMarker } from "@twurple/api";
import { ApiResourceBase } from './api-resource-base';
import logger from '../../../../logwrapper';
import accountAccess from "../../../../common/account-access";
import { getDateDiffString } from "../../../../utils";

export class TwitchStreamsApi extends ApiResourceBase {
    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        super(streamerClient, botClient);
    }

    async createStreamMarker(description?: string): Promise<HelixStreamMarker> {
        try {
            const streamerId = accountAccess.getAccounts().streamer.userId;

            return await this._streamerClient.streams.createStreamMarker(streamerId, description);
        } catch (err) {
            const error = err as Error;
            logger.error(`Failed to create stream marker`, error.message);
        }
    }

    /**
     * Get the streamers current stream. Null if offline.
     */
    async getStreamersCurrentStream(): Promise<HelixStream | null> {
        if (this._streamerClient == null) {
            return null;
        }

        const streamer = accountAccess.getAccounts().streamer;

        if (!streamer?.loggedIn) {
            return null;
        }

        try {
            const stream = await this._streamerClient.streams.getStreamByUserId(streamer.userId);
            return stream;
        } catch (err) {
            const error = err as Error;
            logger.error("Error while trying to get streamers broadcast", error.message);
        }

        return null;
    }

    async getStreamUptime(): Promise<string> {
        const stream = await this.getStreamersCurrentStream();

        if (stream == null) {
            return "Not currently broadcasting";
        }

        return getDateDiffString(stream.startDate, new Date(), true);
    }
}