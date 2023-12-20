import logger from '../../logwrapper';
import accountAccess from "../../common/account-access";
import { ApiClient, HelixPoll } from "@twurple/api";

export class TwitchPollsApi {
    private _streamerClient: ApiClient;
    private _botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this._streamerClient = streamerClient;
        this._botClient = botClient;
    }

    /**
     * Creates a Twitch poll
     *
     * @param title Title of the poll
     * @param choices List of choices for the poll. Minimum of 2, maximum of 5.
     * @param duration Duration in seconds to show poll. Minimum of 15, maximum of 1800 (30 minutes).
     * @param channelPointsPerVote Number of channel points per additional vote. If null, channel point voting will be disabled.
     */
    async createPoll(title: string, choices: string[], duration: number, channelPointsPerVote: number = null): Promise<void> {
        try {
            const streamerId = accountAccess.getAccounts().streamer.userId;

            this._streamerClient.polls.createPoll(streamerId, {
                title: title,
                choices: choices,
                duration: duration,
                channelPointsPerVote: channelPointsPerVote
            });
        } catch (error) {
            logger.error("Failed to create Twitch poll", error.message);
        }
    }

    /**
     * End a Twitch poll.
     *
     * @param pollId The poll ID.
     * @param showResult Whether to show the result, or archive and hide the result.
     */
    async endPoll(pollId: string, showResult = true): Promise<void> {
        try {
            const streamerId = accountAccess.getAccounts().streamer.userId;

            await this._streamerClient.polls.endPoll(streamerId, pollId, showResult);
        } catch (error) {
            logger.error("Failed to end Twitch poll", error.message);
        }
    }

    /**
     * Retrieve the most recent Twitch poll
     *
     * @returns A HelixPoll object with the most recent Twitch poll data
     */
    async getMostRecentPoll(): Promise<HelixPoll> {
        try {
            const streamerId = accountAccess.getAccounts().streamer.userId;

            const polls = await this._streamerClient.polls.getPolls(streamerId);

            return polls.data[0];

        } catch (error) {
            logger.error("Failed to get most recent Twitch poll", error.message);
            return null;
        }
    }
}