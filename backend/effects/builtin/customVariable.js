"use strict";

const customVariableManager = require("../../common/custom-variable-manager");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const fileWriter = {
    definition: {
        id: "firebot:customvariable",
        name: "Custom Variable",
        description: "Save data to a custom variable that you can then use elsewhere.",
        tags: ["Built in"],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container header="Variable Name">
            <p class="muted">You'll use this name to reference this elsewhere via the $customVariable replace phrase.</p>
            <input ng-model="effect.name" type="text" class="form-control" id="chat-text-setting" placeholder="Enter name" replace-variables>
        </eos-container>

        <eos-container header="Variable Data" pad-top="true">
            <p class="muted">This is the data that will be saved to the variable. Can be text or another replace phrase.</p>
            <textarea ng-model="effect.variableData" rows="3" class="form-control" id="chat-text-setting" placeholder="Enter text/data" replace-variables></textarea>
        </eos-container>

        <eos-container header="Duration" pad-top="true">
            <p class="muted">Duration (in seconds) this variable should be kept in the cache. Use 0 for indefinite (until Firebot restarts). </p>
            <input ng-model="effect.ttl" type="number" class="form-control" id="chat-text-setting" placeholder="Enter seconds">
        </eos-container>
    `,
    optionsController: ($scope) => {
        if ($scope.effect.ttl === undefined) {
            $scope.effect.ttl = 0;
        }
    },
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
    onTriggerEvent: async event => {
        let { effect } = event;

        customVariableManager.addCustomVariable(effect.name, effect.variableData, effect.ttl);

        return true;
    }
};

module.exports = fileWriter;
