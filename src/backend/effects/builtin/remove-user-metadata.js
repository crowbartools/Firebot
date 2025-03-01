"use strict";

const { EffectCategory } = require('../../../shared/effect-constants');

const effect = {
    definition: {
        id: "firebot:remove-user-metadata",
        name: "Remove User Metadata",
        description: "Remove a key from metadata associated to a given user",
        icon: "fad fa-user-cog",
        categories: [EffectCategory.ADVANCED, EffectCategory.SCRIPTING],
        dependencies: []
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container header="Username">
            <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="effect.username" placeholder="Enter username" replace-variables menu-position="below" />
        </eos-container>

        <eos-container header="Metadata Key" pad-top="true">
            <p class="muted">Define which key you want to delete from this users metadata.</p>
            <input ng-model="effect.key" type="text" class="form-control" id="chat-text-setting" placeholder="Enter key name" replace-variables>
        </eos-container>
    `,
    optionsController: () => { },
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
    onTriggerEvent: async (event) => {
        const { effect } = event;
        const { username, key } = effect;

        const viewerMetadataManager = require("../../viewers/viewer-metadata-manager");

        await viewerMetadataManager.removeViewerMetadata(username, key);

        return true;
    }
};

module.exports = effect;
