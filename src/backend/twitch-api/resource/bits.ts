import { ApiClient, HelixBitsLeaderboardEntry, HelixBitsLeaderboardPeriod, HelixBitsLeaderboardQuery } from "@twurple/api/lib";

const logger = require("../../logwrapper");
const twitchApi = require("../api");

export async function getChannelBitsLeaderboard(
    count: number = 10,
    period: HelixBitsLeaderboardPeriod = "all"
): Promise<HelixBitsLeaderboardEntry[]> {
    const client: ApiClient = twitchApi.getClient();
    const leaderboard: HelixBitsLeaderboardEntry[] = [];

    try {
        const params: HelixBitsLeaderboardQuery = {
            count: count,
            period: period
        };
        leaderboard.push(...(await client.bits.getLeaderboard(params)).entries);
    } catch (error) {
        logger.error("Failed to get channel bits leaderboard", error);
    }

    return leaderboard;
}

export async function getChannelBitsTopCheerers(
    count: number = 1,
    period: HelixBitsLeaderboardPeriod = "all"
): Promise<String[]> {
    const leaderboard = await getChannelBitsLeaderboard(count, period);

    return leaderboard.map(l => {
        return l.userName
    })
}