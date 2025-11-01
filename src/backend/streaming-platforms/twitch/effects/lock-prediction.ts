import type { EffectType } from "../../../../types/effects";
import { TwitchApi } from "../api";
import logger from "../../../logwrapper";

const model: EffectType = {
    definition: {
        id: "twitch:lock-prediction",
        name: "Lock Twitch Prediction",
        description: "Locks the currently active Twitch prediction so that no more predictions can be made",
        icon: "fad fa-lock",
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

        if (latestPrediction?.status !== "ACTIVE") {
            logger.warn("There is no active Twitch prediction to lock");
            return;
        }

        logger.debug(`Locking Twitch prediction "${latestPrediction.title}"`);
        return await TwitchApi.predictions.lockPrediciton(latestPrediction.id);
    }
};

export = model;
