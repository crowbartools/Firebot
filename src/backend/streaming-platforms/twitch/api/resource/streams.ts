import { HelixStream, HelixStreamMarker } from "@twurple/api";
import { ApiResourceBase } from './api-resource-base';
import type { TwitchApi } from "../";
import { getDateDiffString } from "../../../../utils";

export class TwitchStreamsApi extends ApiResourceBase {
    constructor(apiBase: typeof TwitchApi) {
        super(apiBase);
    }

    async createStreamMarker(description?: string): Promise<HelixStreamMarker> {
        try {
            const streamerId = this.accounts.streamer.userId;

            return await this.streamerClient.streams.createStreamMarker(streamerId, description);
        } catch (err) {
            const error = err as Error;
            this.logger.error(`Failed to create stream marker`, error.message);
        }
    }

    /**
     * Get the streamers current stream. Null if offline.
     */
    async getStreamersCurrentStream(): Promise<HelixStream | null> {
        if (this.streamerClient == null) {
            return null;
        }

        const streamer = this.accounts.streamer;

        if (!streamer?.loggedIn) {
            return null;
        }

        try {
            const stream = await this.streamerClient.streams.getStreamByUserId(streamer.userId);
            return stream;
        } catch (err) {
            const error = err as Error;
            this.logger.error("Error while trying to get streamers broadcast", error.message);
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