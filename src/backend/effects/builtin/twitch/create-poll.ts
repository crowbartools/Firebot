import { EffectType } from "../../../../types/effects";
import { EffectCategory } from "../../../../shared/effect-constants";
import logger from "../../../logwrapper";
import twitchApi from "../../../twitch-api/api";

const model: EffectType<{
    title: string;
    choices: string[];
    duration: number;
    allowChannelPointVoting: boolean;
    channelPointsPerVote: number;
}> = {
    definition: {
        id: "twitch:create-poll",
        name: "Create Twitch Poll",
        description: "Creates a Twitch poll",
        icon: "fad fa-poll-h",
        categories: [EffectCategory.COMMON, EffectCategory.TWITCH],
        dependencies: {
            twitch: true
        }
    },
    optionsTemplate: `
        <eos-container header="Poll Title">
            <firebot-input input-title="Title" model="effect.title" placeholder-text="Enter poll title" menu-position="under" />
        </eos-container>

        <eos-container header="Poll Duration" pad-top="true">
            <firebot-input input-title="Duration" input-type="number" disable-variables="true" model="effect.duration" placeholder-text="Enter duration in seconds" />
        </eos-container>

        <eos-container header="Channel Point Voting" pad-top="true">
            <firebot-checkbox model="effect.allowChannelPointVoting" label="Allow Channel Point Voting" />
            <firebot-input ng-if="effect.allowChannelPointVoting" input-title="Channel Points Per Vote" input-type="number" disable-variables="true" model="effect.channelPointsPerVote" placeholder-text="Enter channel points per vote" />
        </eos-container>

        <eos-container header="Choices" pad-top="true">
            <editable-list settings="optionSettings" model="effect.choices" />
        </eos-container>

        <eos-container>
            <div class="effect-info alert alert-warning">
                Note: You may only have one poll running at a time.
            </div>
        </eos-container>
    `,
    optionsValidator: (effect) => {
        const errors: string[] = [];

        if (!effect.title?.length || effect.title.length === 0) {
            errors.push("You must enter a title");
        }

        if (!(effect.duration >= 15 && effect.duration <= 1800)) {
            errors.push("Duration must be between 15 and 1800 seconds");
        }

        if (!effect.choices?.length || !(effect.choices.length >= 2 && effect.choices.length <= 5)) {
            errors.push("You must enter between 2 and 5 choices");
        }

        if (
            effect.allowChannelPointVoting &&
            !(effect.channelPointsPerVote >= 1 && effect.channelPointsPerVote <= 1000000)
        ) {
            errors.push("Channel points per vote must be between 1 and 1,000,000");
        }

        return errors;
    },
    optionsController: ($scope) => {
        $scope.optionSettings = {
            noDuplicates: true,
            maxItems: 5,
            trigger: $scope.trigger,
            triggerMeta: $scope.triggerMeta
        };
    },
    onTriggerEvent: async ({ effect }) => {
        if (!effect.title.length || effect.title.length < 1 || effect.title.length > 60) {
            logger.error(`Unable to create poll. Poll title "${effect.title}" must be between 1 and 60 characters.`);
            return false;
        }

        effect.choices.forEach(c => {
            if (!c.length || c.length < 1 || c.length > 25) {
                logger.error(`Unable to create poll. Poll choice "${c}" must be between 1 and 25 characters.`);
                return false;
            }
        });

        logger.debug(`Creating Twitch poll "${effect.title}"`);
        return await twitchApi.polls.createPoll(
            effect.title,
            effect.choices,
            effect.duration,
            effect.allowChannelPointVoting ? effect.channelPointsPerVote : null
        );
    }
};

module.exports = model;
