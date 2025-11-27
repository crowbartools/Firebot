import {
    HelixBitsLeaderboardEntry,
    HelixBitsLeaderboardPeriod,
    HelixBitsLeaderboardQuery,
    HelixCheermoteList
} from "@twurple/api";
import { ApiResourceBase } from "./api-resource-base";
import type { TwitchApi } from "../";

export class TwitchBitsApi extends ApiResourceBase {
    constructor(apiBase: typeof TwitchApi) {
        super(apiBase);
    }

    async getChannelBitsLeaderboard(
        count = 10,
        period: HelixBitsLeaderboardPeriod = "all",
        startDate: Date = new Date(),
        userId?: string
    ): Promise<HelixBitsLeaderboardEntry[]> {
        const streamerId: string = this.accounts.streamer.userId;
        const leaderboard: HelixBitsLeaderboardEntry[] = [];

        try {
            const params: HelixBitsLeaderboardQuery = {
                count: count,
                period: period,
                startDate: startDate,
                contextUserId: userId
            };
            leaderboard.push(...(await this.streamerClient.bits.getLeaderboard(streamerId, params)).entries);
        } catch (error) {
            this.logger.error(`Failed to get channel bits leaderboard: ${(error as Error).message}`);
        }

        return leaderboard;
    }

    async getChannelBitsTopCheerers(
        count = 1,
        period: HelixBitsLeaderboardPeriod = "all",
        startDate: Date = new Date()
    ): Promise<string[]> {
        const leaderboard = await this.getChannelBitsLeaderboard(count, period, startDate);

        return leaderboard.map((l) => {
            return l.userName;
        });
    }

    async getChannelCheermotes(): Promise<HelixCheermoteList> {
        try {
            const streamerId: string = this.accounts.streamer.userId;
            return await this.streamerClient.bits.getCheermotes(streamerId);
        } catch (error) {
            this.logger.error(`Error getting channel cheermotes: ${(error as Error).message}`);
            return null;
        }
    }
}