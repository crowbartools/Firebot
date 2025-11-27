import type { EffectType } from "../../../types/effects";
import viewerMetadataManager from "../../viewers/viewer-metadata-manager";

const effect: EffectType<{
    username: string;
    key: string;
}> = {
    definition: {
        id: "firebot:remove-user-metadata",
        name: "Remove User Metadata",
        description: "Remove a key from metadata associated to a given user",
        icon: "fad fa-user-cog",
        categories: ["advanced", "scripting", "firebot control"],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container header="Username">
            <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="effect.username" placeholder="Enter username" replace-variables menu-position="below" />
        </eos-container>

        <eos-container header="Metadata Key" pad-top="true">
            <p class="muted">Define which key you want to delete from this users metadata.</p>
            <input ng-model="effect.key" type="text" class="form-control" id="chat-text-setting" placeholder="Enter key name" replace-variables>
        </eos-container>
    `,
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.username == null || effect.username === "") {
            errors.push("Please provide a username.");
        }
        if (effect.key == null || effect.key === "") {
            errors.push("Please provide a key name.");
        }
        return errors;
    },
    getDefaultLabel: (effect) => {
        return `${effect.username} - ${effect.key}`;
    },
    onTriggerEvent: async ({ effect }) => {
        const { username, key } = effect;

        await viewerMetadataManager.removeViewerMetadata(username, key);

        return true;
    }
};

export = effect;