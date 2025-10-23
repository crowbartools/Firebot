import { HelixVideo } from "@twurple/api";
import { ApiResourceBase } from "./api-resource-base";
import type { TwitchApi } from "../";

export class TwitchVideosApi extends ApiResourceBase {
    constructor(apiBase: typeof TwitchApi) {
        super(apiBase);
    }

    /**
     * Gets the VOD object for the specified stream
     * @param streamId ID of the stream
     * @returns A {@linkcode HelixVideo} object representing the VOD
     */
    async getVodByStreamId(streamId: string): Promise<HelixVideo> {
        const streamer = this.accounts.streamer;
        const vods = await this.streamerClient.videos.getVideosByUser(streamer.userId, { type: 'archive', limit: 1 });
        if (vods.data.length === 0) {
            this.logger.warn(`No VOD found for stream ID ${streamId}`);
            return null;
        }
        if (!vods.data[0].streamId || vods.data[0].streamId !== streamId) {
            this.logger.warn(`No VOD found for stream ID ${streamId}`);
            return null;
        }
        return vods.data[0];
    }
}