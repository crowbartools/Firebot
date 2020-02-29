"use strict";

const customVariableManager = require("../../common/custom-variable-manager");

const util = require("../../utility");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;

/**
 * The custom var effect
 */
const fileWriter = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:customvariable",
        name: "Custom Variable",
        description: "Save data to a custom variable that you can then use else where.",
        tags: ["Built in"],
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
        <eos-container header="Variable Name">
            <p>You'll use this name to reference this elsewhere via the $customVariable replace phrase.</p>
            <input ng-model="effect.name" type="text" class="form-control" id="chat-text-setting" placeholder="Enter name" replace-variables>
        </eos-container>

        <eos-container header="Variable Data" pad-top="true">
            <p>This is the data that will be saved to the variable. Can be text or another replace phrase.</p>
            <input ng-model="effect.variableData" type="text" class="form-control" id="chat-text-setting" placeholder="Enter text/data" replace-variables>
        </eos-container>

        <eos-container header="Duration" pad-top="true">
            <p>Duration in seconds this variable should be kept in the cache. 0 for indefinite (until Firebot restarts). </p>
            <input ng-model="effect.ttl" type="number" class="form-control" id="chat-text-setting" placeholder="Enter seconds">
        </eos-container>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: ($scope, listenerService) => {},
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.name == null || effect.name === "") {
            errors.push("Please provide a variable name.");
        }
        if (effect.variableData == null || effect.variableData === "") {
            errors.push("Please provide some variable data.");
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async event => {
        // What should this do when triggered.
        let effect = event.effect;

        let data = await util.populateStringWithTriggerData(effect.variableData, event.trigger);
        customVariableManager.addCustomVariable(effect.name, data, effect.ttl);

        return true;
    },
    /**
   * Code to run in the overlay
   */
    overlayExtension: {
        dependencies: {
            css: [],
            js: []
        },
        event: {
            name: "customVar",
            onOverlayEvent: event => {

            }
        }
    }
};

module.exports = fileWriter;
