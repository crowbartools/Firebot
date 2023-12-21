import logger from '../../logwrapper';
import accountAccess from "../../common/account-access";
import { ApiClient, HelixGoal } from "@twurple/api";

export class TwitchGoalsApi {
    private _streamerClient: ApiClient;
    private _botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this._streamerClient = streamerClient;
        this._botClient = botClient;
    }

    /**
     * Retrieves the current Twitch channel goals
     *
     * @returns A HelixPoll object with the most recent Twitch poll data
     */
    async getCurrentChannelGoals(): Promise<HelixGoal[]> {
        try {
            const streamerId = accountAccess.getAccounts().streamer.userId;

            const goals = await this._streamerClient.goals.getGoals(streamerId);

            return goals;
        } catch (error) {
            logger.error("Failed to get channel goals", error.message);
            return null;
        }
    }
}