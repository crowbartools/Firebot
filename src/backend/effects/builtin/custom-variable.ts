import type { EffectType, SettingsService } from "../../../types";
import { CustomVariableManager } from "../../common/custom-variable-manager";

const effect: EffectType<{
    name: string;
    variableData: string;
    ttl: number;
    propertyPath: string;
    persistToFile?: boolean;
}> = {
    definition: {
        id: "firebot:customvariable",
        name: "Custom Variable",
        description: "Save data to a custom variable that you can then use elsewhere.",
        icon: "fad fa-value-absolute",
        categories: ["scripting"],
        dependencies: []
    },
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
            <p class="muted">Duration (in seconds) this variable should be kept in the cache. Use 0 for indefinite (until Firebot restarts unless persisted). </p>
            <input ng-model="effect.ttl" type="number" class="form-control" id="chat-text-setting" placeholder="Enter seconds">

            <div class="form-group flex justify-between pt-10" ng-if="!persistAllVarsEnabled">
                <div>
                    <label class="control-label" style="margin:0;">Persist</label>
                    <p class="help-block">If enabled, this variable will be saved to file and reloaded when Firebot restarts.</p>
                </div>
                <div class="ml-5">
                    <toggle-button toggle-model="effect.persistToFile" auto-update-value="true" font-size="32"></toggle-button>
                </div>
            </div>
        </eos-container>

        <eos-container pad-top="true">
            <div class="effect-info well">
                Want to inspect variable values in real-time for debugging purposes? Open the <a ng-click="openVariableInspector()" style="color:#53afff;cursor:pointer;">Custom Variable Inspector</a>
            </div>
        </eos-container>
    `,
    optionsController: ($scope, backendCommunicator, settingsService: SettingsService) => {
        if ($scope.effect.ttl === undefined) {
            $scope.effect.ttl = 0;
        }

        $scope.openVariableInspector = function () {
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
                    mode: { name: "javascript", json: true },
                    theme: 'blackboard',
                    lineNumbers: true,
                    autoRefresh: true,
                    showGutter: true
                }
            }
        ];

        $scope.persistAllVarsEnabled = settingsService.getSetting("PersistCustomVariables");

        $scope.initialEditorLabel = $scope.effect?.variableData?.startsWith("{") || $scope.effect?.variableData?.startsWith("[") ? "JSON" : "Basic";
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (effect.name == null || effect.name === "") {
            errors.push("Please provide a variable name.");
        }
        return errors;
    },
    getDefaultLabel: (effect) => {
        return effect.name;
    },
    onTriggerEvent: ({ effect }) => {
        CustomVariableManager.addCustomVariable(effect.name, effect.variableData, effect.ttl, effect.propertyPath, effect.persistToFile);
        return true;
    }
};

export = effect;