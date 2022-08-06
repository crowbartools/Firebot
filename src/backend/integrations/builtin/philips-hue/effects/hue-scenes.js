"use strict";

const { EffectCategory } = require("../../../../../shared/effect-constants");
const hueManager = require("../hue-manager");

const effect = {
    definition: {
        id: "hue:scenes",
        name: "Hue Scenes",
        description: "Activate a Philips Hue scene",
        icon: "far fa-lightbulb fa-align-center",
        categories: [EffectCategory.INTEGRATIONS],
        dependencies: []
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container header="Activate Hue Scene">
            <ui-select ng-model="selectedScene" theme="bootstrap" on-select="sceneSelected($item)" style="margin-bottom:10px;">
                <ui-select-match placeholder="Search for scene">
                    <div style="height: 21px; display:flex; flex-direction: row; align-items: center;">
                        <div style="font-weight: 100;font-size: 17px;">{{$select.selected._data.name}}</div>
                    </div>
                </ui-select-match>
                <ui-select-choices minimum-input-length="1" repeat="scene in hueScenes | filter: $select.search" style="position:relative;">
                    <div style="height: 35px; display:flex; flex-direction: row; align-items: center;">
                        <div style="font-weight: 100;font-size: 17px;">{{scene._data.name}}</div>
                    </div>
                </ui-select-choices>
            </ui-select>
        </eos-container>
    `,
    optionsController: ($scope, $q, backendCommunicator) => {
        $scope.hueScenes = [];

        $scope.selectedScene = null;

        $q.when(backendCommunicator.fireEventAsync("getAllHueScenes"))
            .then(scenes => {
                if (scenes) {
                    $scope.hueScenes = scenes;
                    if ($scope.effect.sceneId) {
                        $scope.selectedScene = $scope.hueScenes.find(s => s._data.id === $scope.effect.sceneId);
                    }
                }
            });

        $scope.sceneSelected = (scene) => {
            if (scene) {
                $scope.effect.sceneId = scene._data.id;
            }
        };
    },
    optionsValidator: () => {},
    onTriggerEvent: async (event) => {
        const effect = event.effect;
        const sceneId = effect.sceneId;

        hueManager.setHueScene(sceneId);
    }
};

module.exports = effect;
