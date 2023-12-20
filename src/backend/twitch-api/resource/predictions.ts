import logger from '../../logwrapper';
import accountAccess from "../../common/account-access";
import { ApiClient, HelixPrediction } from "@twurple/api";

export class TwitchPredictionsApi {
    private _streamerClient: ApiClient;
    private _botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this._streamerClient = streamerClient;
        this._botClient = botClient;
    }

    /**
     * Creates a Twitch prediction
     *
     * @param title Title of the prediction
     * @param outcomes List of outcomes for the prediction. Minimum of 2, maximum of 10.
     * @param duration Duration in seconds to allow predictions. Minimum of 30, maximum of 1800 (30 minutes).
     */
    async createPrediction(title: string, outcomes: string[], duration: number): Promise<void> {
        try {
            const streamerId = accountAccess.getAccounts().streamer.userId;

            this._streamerClient.predictions.createPrediction(streamerId, {
                title: title,
                outcomes: outcomes,
                autoLockAfter: duration
            });
        } catch (error) {
            logger.error("Failed to create Twitch prediction", error.message);
        }
    }

    /**
     * Locks a Twitch prediction so no more predictions can be made
     *
     * @param predictionId The prediction ID.
     */
    async lockPrediciton(predictionId: string): Promise<void> {
        try {
            const streamerId = accountAccess.getAccounts().streamer.userId;

            await this._streamerClient.predictions.lockPrediction(streamerId, predictionId);
        } catch (error) {
            logger.error("Failed to lock Twitch prediction", error.message);
        }
    }

    /**
     * Cancels a Twitch prediction and refunds all wagered channel points
     *
     * @param predictionId The prediction ID.
     */
    async cancelPrediction(predictionId: string): Promise<void> {
        try {
            const streamerId = accountAccess.getAccounts().streamer.userId;

            await this._streamerClient.predictions.cancelPrediction(streamerId, predictionId);
        } catch (error) {
            logger.error("Failed to cancel Twitch prediction", error.message);
        }
    }

    /**
     * Resolve a Twitch prediction.
     *
     * @param predictionId The prediction ID.
     * @param outcomeId The winning outcome ID.
     */
    async resolvePrediction(predictionId: string, outcomeId: string): Promise<void> {
        try {
            const streamerId = accountAccess.getAccounts().streamer.userId;

            await this._streamerClient.predictions.resolvePrediction(streamerId, predictionId, outcomeId);
        } catch (error) {
            logger.error("Failed to resolve Twitch prediction", error.message);
        }
    }

    /**
     * Retrieve the most recent Twitch prediction
     *
     * @returns A HelixPrediction object with the most recent Twitch prediction data
     */
    async getMostRecentPrediction(): Promise<HelixPrediction> {
        try {
            const streamerId = accountAccess.getAccounts().streamer.userId;

            const predictions = await this._streamerClient.predictions.getPredictions(streamerId);

            return predictions.data[0];

        } catch (error) {
            logger.error("Failed to get most recent Twitch prediction", error.message);
            return null;
        }
    }
}