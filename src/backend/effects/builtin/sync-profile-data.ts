import { EffectType } from "../../../types/effects";
import * as cloudSync from "../../cloud-sync";

const effect: EffectType<{
    profilePage: "commands" | "quotes";
}> = {
    definition: {
        id: "firebot:sync-profile-data",
        name: "Sync Data to Profile Page",
        description: "Syncs your data to your Firebot profile page",
        icon: "fad fa-sync",
        categories: ["advanced", "scripting", "firebot control"],
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

        <eos-container pad-top="true">
            <div class="effect-info alert alert-info">
                After sync, you can access the JSON of your profile data at <a href="https://api.crowbar.tools/v1/profile-data/{{username}}">https://api.crowbar.tools/v1/profile-data/{{username}}</a>
            </div>
        </eos-container>
    `,
    optionsController: ($scope, accountAccess) => {
        $scope.username = accountAccess.accounts.streamer.username;

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

export = effect;