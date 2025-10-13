import { ApiClient } from "@twurple/api";
import { ApiResourceBase } from "./api-resource-base";
import logger from "../../../../logwrapper";
import accountAccess from "../../../../common/account-access";

export class TwitchVideosApi extends ApiResourceBase {
    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        super(streamerClient, botClient);
    }

    async getVodByStreamId(streamId: string) {
        const streamer = accountAccess.getAccounts().streamer;
        const vods = await this._streamerClient.videos.getVideosByUser(streamer.userId, { type: 'archive', limit: 1 });
        if (vods.data.length === 0) {
            logger.warn(`No VOD found for stream ID ${streamId}`);
            return null;
        }
        if (!vods.data[0].streamId || vods.data[0].streamId !== streamId) {
            logger.warn(`No VOD found for stream ID ${streamId}`);
            return null;
        }
        return vods.data[0];
    }
}