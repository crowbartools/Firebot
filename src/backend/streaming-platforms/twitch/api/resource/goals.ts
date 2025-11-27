import { HelixGoal } from "@twurple/api";
import { ApiResourceBase } from './api-resource-base';
import type { TwitchApi } from "../";

export class TwitchGoalsApi extends ApiResourceBase {
    constructor(apiBase: typeof TwitchApi) {
        super(apiBase);
    }

    /**
     * Retrieves the current Twitch channel goals
     *
     * @returns A HelixPoll object with the most recent Twitch poll data
     */
    async getCurrentChannelGoals(): Promise<HelixGoal[]> {
        try {
            const streamerId = this.accounts.streamer.userId;

            const goals = await this.streamerClient.goals.getGoals(streamerId);

            return goals;
        } catch (error) {
            this.logger.error(`Failed to get channel goals: ${(error as Error).message}`);
            return null;
        }
    }
}