"use strict";

const { ControlKind, InputEvent } = require('../../../../interactive/constants/MixplayConstants');
const effectModels = require("../../../../effects/models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require("../../../../../shared/effect-constants");

const hueHandler = require("../hue-handler");

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
        <dropdown-select options="hueScenes" selected="effect.scene"></dropdown-select>
    </eos-container>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: async ($scope) => {
        $scope.hueScenes = await hueHandler.getAllHueScenes();
        console.log($scope.hueScenes);
    },
    /**
   * When the effect is saved
   */
    optionsValidator: () => {

    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async () => {
        // TODO: Activate Scene
        const hueIntegration = integrationManager.getIntegrationDefinitionById("hue");
    }
};

module.exports = effect;
