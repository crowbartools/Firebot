import { ApiClient, HelixGoal } from "@twurple/api";
import { ApiResourceBase } from './api-resource-base';
import logger from '../../../../logwrapper';
import accountAccess from "../../../../common/account-access";

export class TwitchGoalsApi extends ApiResourceBase {
    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        super(streamerClient, botClient);
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