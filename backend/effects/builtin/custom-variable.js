"use strict";

const customVariableManager = require("../../common/custom-variable-manager");
const { EffectCategory } = require('../../../shared/effect-constants');

const fileWriter = {
    definition: {
        id: "firebot:customvariable",
        name: "Custom Variable",
        description: "Save data to a custom variable that you can then use elsewhere.",
        icon: "fad fa-value-absolute",
        categories: [EffectCategory.SCRIPTING],
        dependencies: []
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
            <p class="muted" style="font-size: 11px;"><b>Note:</b> If variable data is a valid JSON string, it will be parsed into an object or array.</p>
        </eos-container>

        <eos-container header="Property Path (Optional)" pad-top="true">
            <p class="muted">If the variable already has data saved in the form of an object or array, you can define a path (using dot notation) to a specific property or index to update with the above data. If nothing is provided, the entire variable is replaced. If there is no existing data and a property path is provided, nothing happens.</p>
            <eos-collapsable-panel show-label="Show examples" hide-label="Hide examples" hide-info-box="true">
                <span>Examples:</span>
                <ul>
                    <li>some.property</li>
                    <li>1</li>
                    <li>1.value</li>
                </ul>
            </eos-collapsable-panel>
            <input ng-model="effect.propertyPath" type="text" class="form-control" id="propertyPath" placeholder="Enter path">
        </eos-container>

        <eos-container header="Duration (Optional)" pad-top="true">
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
        return errors;
    },
    onTriggerEvent: async event => {
        let { effect } = event;

        customVariableManager.addCustomVariable(effect.name, effect.variableData, effect.ttl, effect.propertyPath);

        return true;
    }
};

module.exports = fileWriter;
