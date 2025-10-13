import accountAccess from "../../../../common/account-access";
import logger from "../../../../logwrapper";
import { ApiClient } from "@twurple/api";

export class TwitchVideosApi {
    private _streamerClient: ApiClient;
    private _botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this._streamerClient = streamerClient;
        this._botClient = botClient;
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