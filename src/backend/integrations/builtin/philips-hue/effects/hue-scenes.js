"use strict";

const { EffectCategory } = require("../../../../../shared/effect-constants");
const hueManager = require("../hue-manager");

const effect = {
    definition: {
        id: "hue:scenes",
        name: "Activate Hue Scene",
        description: "Activate a Philips Hue scene",
        icon: "far fa-house-signal fa-align-center",
        categories: [EffectCategory.INTEGRATIONS],
        dependencies: []
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container header="Activate Hue Scene">
            <firebot-searchable-select
                items="hueScenes"
                ng-model="effect.sceneId"
                placeholder="Search for scene"
                class="mb-2"
            />
        </eos-container>
    `,
    optionsController: ($scope, backendCommunicator) => {
        $scope.hueScenes = [];

        backendCommunicator.fireEventAsync("getAllHueScenes")
            .then((scenes) => {
                $scope.hueScenes = scenes;
            });
    },
    optionsValidator: () => {},
    onTriggerEvent: async ({ effect }) => {
        const sceneId = effect.sceneId;

        hueManager.setHueScene(sceneId);
    }
};

module.exports = effect;
