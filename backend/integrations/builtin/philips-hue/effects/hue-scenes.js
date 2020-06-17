"use strict";

const { ControlKind, InputEvent } = require('../../../../interactive/constants/MixplayConstants');
const effectModels = require("../../../../effects/models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require("../../../../../shared/effect-constants");

const hueManager = require("../hue-manager");

const integrationManager = require("../../../IntegrationManager");

/**
 * The Delay effect
 */
const effect = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "hue:scenes",
        name: "Hue Scenes",
        description: "Activate a Philips Hue scene",
        icon: "far fa-lightbulb fa-align-center",
        categories: [EffectCategory.INTEGRATIONS],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    /**
   * Global settings that will be available in the Settings tab
   */
    globalSettings: {},
    /**
   * The HTML template for the Options view (ie options when effect is added to something such as a button.
   * You can alternatively supply a url to a html file via optionTemplateUrl
   */
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
    /**
   * The controller for the front end Options
   */
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
    /**
   * When the effect is saved
   */
    optionsValidator: () => {

    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async (event) => {
        const effect = event.effect;
        const sceneId = effect.sceneId;

        // TODO: Activate Scene
        const hueIntegration = integrationManager.getIntegrationDefinitionById("hue");
    }
};

module.exports = effect;
