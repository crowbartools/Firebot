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
            <p class="muted">You'll use this name to reference this elsewhere via $customVariable[name].</p>
            <input ng-model="effect.name" type="text" class="form-control" id="chat-text-setting" placeholder="Enter name" replace-variables menu-position="below">
        </eos-container>

        <eos-container header="Variable Data" pad-top="true">
            <p class="muted">This is the data that will be saved to the variable. Can be text or another replace phrase.</p>
            <selectable-input-editors
                editors="editors"
                initial-editor-label="initialEditorLabel"
                model="effect.variableData"
            />
            <p class="muted" style="font-size: 11px;"><b>Note:</b> If variable data is a valid JSON string, it will be parsed into an object or array.</p>
        </eos-container>

        <eos-container header="Property Path (Optional)" pad-top="true">
            <p class="muted">If the variable already has data saved in the form of an object or array, you can define a path (using dot notation) to a specific property or index to update with the above data.</p>
            <p class="muted">If a property path is provided and there is no existing data in the variable, nothing happens.</p>
            <p class="muted">If no property path is provided and the existing variable does NOT contain an array, the entire variable is replaced. If the existing variable contains an array and the new value is NOT an array, the new value will be appended to the array.</p>
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

        <eos-container pad-top="true">
            <div class="effect-info well">
                Want to inspect variable values in real-time for debugging purposes? Open the <a ng-click="openVariableInspector()" style="color:#53afff;cursor:pointer;">Custom Variable Inspector</a>
            </div>
        </eos-container>
    `,
    optionsController: ($scope, backendCommunicator) => {
        if ($scope.effect.ttl === undefined) {
            $scope.effect.ttl = 0;
        }

        $scope.openVariableInspector = function() {
            backendCommunicator.fireEvent("show-variable-inspector");
        };

        $scope.editors = [
            {
                label: "Basic",
                inputType: "text",
                useTextArea: true,
                placeholderText: "Enter variable data",
                menuPosition: "under"
            },
            {
                label: "JSON",
                inputType: "codemirror",
                menuPosition: "under",
                codeMirrorOptions: {
                    mode: {name: "javascript", json: true},
                    theme: 'blackboard',
                    lineNumbers: true,
                    autoRefresh: true,
                    showGutter: true
                }
            }
        ];

        $scope.initialEditorLabel = $scope.effect?.variableData?.startsWith("{") || $scope.effect?.variableData?.startsWith("[") ? "JSON" : "Basic";
    },
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.name == null || effect.name === "") {
            errors.push("Please provide a variable name.");
        }
        return errors;
    },
    onTriggerEvent: async (event) => {
        const { effect } = event;

        customVariableManager.addCustomVariable(effect.name, effect.variableData, effect.ttl, effect.propertyPath);

        return true;
    }
};

module.exports = fileWriter;
