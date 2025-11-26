import { EffectType } from "../../../types/effects";
import { CounterManager } from "../../counters/counter-manager";
import logger from "../../logwrapper";

const effect: EffectType<{
    moderationSettings: any;
    counterId: string;
    mode: string;
    value: string;
}> = {
    definition: {
        id: "firebot:update-moderation-settings",
        name: "Update Moderation Settings",
        description: "Update the settings on the Moderation tab.",
        icon: "fad fa-gavel",
        categories: ["common", "moderation", "firebot control"],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container>
            <firebot-checkbox
                label="Global Exempt Roles"
                model="effect.moderationSettings.exemptRoles.update"
                aria-label="Global Exempt Roles"
            />

            <firebot-checkbox
                label="Banned Word List"
                model="effect.moderationSettings.bannedWordsList.update"
                aria-label="Banned Word List"
            />

            <firebot-checkbox
                label="Emote/Emoji Limit"
                model="effect.moderationSettings.emoteLimit.update"
                aria-label="Emote/Emoji Limit"
            />

            <firebot-checkbox
                label="URL Moderation"
                model="effect.moderationSettings.urlModeration.update"
                aria-label="URL Moderation"
            />
        </eos-container>
    `,
    optionsController: ($scope) => {
        if ($scope.effect.moderationSettings == null) {
            $scope.effect.moderationSettings = {
                exemptRoles: {
                    update: false
                },
                bannedWordsList: {
                    update: false
                },
                emoteLimit: {
                    update: false
                },
                urlModeration: {
                    update: false
                }
            };
        }

    },
    optionsValidator: (effect, $scope) => {
        const errors: string[] = [];

        return errors;
    },
    onTriggerEvent: async (event) => {
        const { effect } = event;

        return true;
    }
};

export = effect;