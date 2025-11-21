import type { EffectType } from "../../../../types/effects";
import { TwitchApi } from "../api";
import logger from "../../../logwrapper";

const model: EffectType = {
    definition: {
        id: "twitch:cancel-prediction",
        name: "Cancel Twitch Prediction",
        description: "Cancels the currently active Twitch prediction and refunds all channel points wagered",
        icon: "fad fa-ban",
        categories: ["common", "twitch"],
        dependencies: {
            twitch: true
        }
    },
    optionsTemplate: `
        <eos-container>
            <div class="effect-info alert alert-warning">
                Note: If there is no prediction currently running, this will take no action.
            </div>
        </eos-container>
    `,
    optionsValidator: () => [],
    optionsController: () => {},
    onTriggerEvent: async () => {
        const latestPrediction = await TwitchApi.predictions.getMostRecentPrediction();

        if (latestPrediction?.status !== "ACTIVE" && latestPrediction?.status !== "LOCKED") {
            logger.warn("There is no active Twitch prediction to cancel");
            return;
        }

        logger.debug(`Canceling Twitch prediction "${latestPrediction.title}"`);
        return await TwitchApi.predictions.cancelPrediction(latestPrediction.id);
    }
};

export = model;
