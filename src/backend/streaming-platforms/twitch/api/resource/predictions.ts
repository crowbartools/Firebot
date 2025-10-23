import { HelixPrediction } from "@twurple/api";
import { ApiResourceBase } from './api-resource-base';
import type { TwitchApi } from "../";

export class TwitchPredictionsApi extends ApiResourceBase {
    constructor(apiBase: typeof TwitchApi) {
        super(apiBase);
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
            const streamerId = this.accounts.streamer.userId;

            await this.streamerClient.predictions.createPrediction(streamerId, {
                title: title,
                outcomes: outcomes,
                autoLockAfter: duration
            });
        } catch (error) {
            this.logger.error("Failed to create Twitch prediction: ", (error as Error).message);
        }
    }

    /**
     * Locks a Twitch prediction so no more predictions can be made
     *
     * @param predictionId The prediction ID.
     */
    async lockPrediciton(predictionId: string): Promise<void> {
        try {
            const streamerId = this.accounts.streamer.userId;

            await this.streamerClient.predictions.lockPrediction(streamerId, predictionId);
        } catch (error) {
            this.logger.error(`Failed to lock Twitch prediction: ${(error as Error).message}`);
        }
    }

    /**
     * Cancels a Twitch prediction and refunds all wagered channel points
     *
     * @param predictionId The prediction ID.
     */
    async cancelPrediction(predictionId: string): Promise<void> {
        try {
            const streamerId = this.accounts.streamer.userId;

            await this.streamerClient.predictions.cancelPrediction(streamerId, predictionId);
        } catch (error) {
            this.logger.error(`Failed to cancel Twitch prediction: ${(error as Error).message}`);
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
            const streamerId = this.accounts.streamer.userId;

            await this.streamerClient.predictions.resolvePrediction(streamerId, predictionId, outcomeId);
        } catch (error) {
            this.logger.error(`Failed to resolve Twitch prediction: ${(error as Error).message}`);
        }
    }

    /**
     * Retrieve the most recent Twitch prediction
     *
     * @returns A HelixPrediction object with the most recent Twitch prediction data
     */
    async getMostRecentPrediction(): Promise<HelixPrediction> {
        try {
            const streamerId = this.accounts.streamer.userId;

            const predictions = await this.streamerClient.predictions.getPredictions(streamerId);

            return predictions.data[0];

        } catch (error) {
            this.logger.error(`Failed to get most recent Twitch prediction: ${(error as Error).message}`);
            return null;
        }
    }
}