import logger from "../../logwrapper";
import accountAccess from "../../common/account-access";
import { ApiClient, HelixBitsLeaderboardEntry, HelixBitsLeaderboardPeriod, HelixBitsLeaderboardQuery, HelixCheermoteList } from "@twurple/api";

export class TwitchBitsApi {
    private _streamerClient: ApiClient;
    private _botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this._streamerClient = streamerClient;
        this._botClient = botClient;
    }

    async getChannelBitsLeaderboard(
        count = 10,
        period: HelixBitsLeaderboardPeriod = "all",
        startDate: Date = new Date(),
        userId?: string
    ): Promise<HelixBitsLeaderboardEntry[]> {
        const streamerId: string = accountAccess.getAccounts().streamer.userId;
        const leaderboard: HelixBitsLeaderboardEntry[] = [];

        try {
            const params: HelixBitsLeaderboardQuery = {
                count: count,
                period: period,
                startDate: startDate,
                contextUserId: userId
            };
            leaderboard.push(...(await this._streamerClient.bits.getLeaderboard(streamerId, params)).entries);
        } catch (error) {
            logger.error("Failed to get channel bits leaderboard", error.message);
        }

        return leaderboard;
    }

    async getChannelBitsTopCheerers(
        count = 1,
        period: HelixBitsLeaderboardPeriod = "all",
        startDate: Date = new Date()
    ): Promise<string[]> {
        const leaderboard = await this.getChannelBitsLeaderboard(count, period, startDate);

        return leaderboard.map(l => {
            return l.userName;
        });
    }

    async getChannelCheermotes(): Promise<HelixCheermoteList> {
        try {
            const streamerId: string = accountAccess.getAccounts().streamer.userId;
            return await this._streamerClient.bits.getCheermotes(streamerId);
        } catch (error) {
            logger.error(`Error getting channel cheermotes: ${error.message}`);
            return null;
        }
    }
}