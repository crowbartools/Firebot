import { EffectType } from "../../../types/effects";
import { EffectCategory } from "../../../shared/effect-constants";
import cloudSync from "../../cloud-sync/profile-sync";
import effect from "./chat-feed-alert";

const model: EffectType<{
    profilePage: "commands" | "quotes";
}> = {
    definition: {
        id: "firebot:sync-profile-data",
        name: "Sync Data to Profile Page",
        description: "Syncs your data to your Firebot profile page",
        icon: "fad fa-sync",
        categories: [EffectCategory.ADVANCED, EffectCategory.SCRIPTING],
        dependencies: {
            twitch: true
        }
    },
    optionsTemplate: `
        <eos-container header="Default Profile Page">
            <firebot-select
                options="{ commands: 'Commands', quotes: 'Quotes' }"
                selected="effect.profilePage"
            />
        </eos-container>
    `,
    optionsController: ($scope) => {
        if (!$scope.effect.profilePage) {
            $scope.effect.profilePage = "commands";
        }
    },
    getDefaultLabel: (effect) => {
        return `Default page: ${effect.profilePage}`;
    },
    onTriggerEvent: async (event) => {
        await cloudSync.syncProfileData({
            username: event.trigger.metadata.username,
            userRoles: [],
            profilePage: event.effect.profilePage ?? "commands"
        });
    }
};

module.exports = model;