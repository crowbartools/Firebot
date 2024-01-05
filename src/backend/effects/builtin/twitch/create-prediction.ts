import { EffectType } from "../../../../types/effects";
import { EffectCategory } from "../../../../shared/effect-constants";
import logger from "../../../logwrapper";
import twitchApi from "../../../twitch-api/api";

const model: EffectType<{
    title: string;
    outcomes: string[];
    duration: number;
}> = {
    definition: {
        id: "twitch:create-prediction",
        name: "Create Twitch Prediction",
        description: "Creates a Twitch prediction",
        icon: "fad fa-question-circle",
        categories: [EffectCategory.COMMON, EffectCategory.TWITCH],
        dependencies: {
            twitch: true
        }
    },
    optionsTemplate: `
        <eos-container header="Prediction Title">
            <firebot-input input-title="Title" model="effect.title" placeholder-text="Enter prediction title" menu-position="under" />
        </eos-container>

        <eos-container header="Prediction Duration" pad-top="true">
            <firebot-input input-title="Duration" input-type="number" disable-variables="true" model="effect.duration" placeholder-text="Enter duration in seconds" />
        </eos-container>

        <eos-container header="Outcomes" pad-top="true">
            <editable-list settings="optionSettings" model="effect.outcomes" />
        </eos-container>

        <eos-container>
            <div class="effect-info alert alert-warning">
                Note: You may only have one prediction running at a time.
            </div>
        </eos-container>
    `,
    optionsValidator: (effect) => {
        const errors: string[] = [];

        if (!effect.title?.length || effect.title.length === 0) {
            errors.push("You must enter a title");
        }

        if (!(effect.duration >= 30 && effect.duration <= 1800)) {
            errors.push("Duration must be between 30 and 1800 seconds");
        }

        if (!effect.outcomes?.length || !(effect.outcomes.length >= 2 && effect.outcomes.length <= 10)) {
            errors.push("You must enter between 2 and 10 outcomes");
        }

        return errors;
    },
    optionsController: ($scope) => {
        $scope.optionSettings = {
            noDuplicates: true,
            maxItems: 10,
            trigger: $scope.trigger,
            triggerMeta: $scope.triggerMeta
        };
    },
    onTriggerEvent: async ({ effect }) => {
        if (!effect.title.length || effect.title.length < 1 || effect.title.length > 45) {
            logger.error(`Unable to create prediction. Prediction title "${effect.title}" must be between 1 and 45 characters.`);
            return false;
        }

        effect.outcomes.forEach(o => {
            if (!o.length || o.length < 1 || o.length > 25) {
                logger.error(`Unable to create prediction. Prediction outcome "${o}" must be between 1 and 25 characters.`);
                return false;
            }
        });

        logger.debug(`Creating Twitch prediction "${effect.title}"`);
        return await twitchApi.predictions.createPrediction(effect.title, effect.outcomes, effect.duration);
    }
};

module.exports = model;
