"use strict";

const { EffectCategory } = require('../../../shared/effect-constants');

const effect = {
    definition: {
        id: "firebot:set-user-metadata",
        name: "Set User Metadata",
        description: "Save metadata associated to a given user",
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
            <p class="muted">You'll use this key to reference this elsewhere via the $userMetadata replace phrase.</p>
            <input ng-model="effect.key" type="text" class="form-control" id="chat-text-setting" placeholder="Enter key name" replace-variables>
        </eos-container>

        <eos-container header="Data" pad-top="true">
            <p class="muted">This is the data that will be saved under the above key in the user's data. Can be text or another replace phrase.</p>
            <selectable-input-editors
                editors="editors"
                initial-editor-label="initialEditorLabel"
                model="effect.data"
            />
            <p class="muted" style="font-size: 11px;"><b>Note:</b> If data is a valid JSON string, it will be parsed into an object or array.</p>

            <div style="margin-top: 10px;">
                <eos-collapsable-panel show-label="Advanced" hide-label="Advanced" hide-info-box="true">
                    <h4>Property Path (Optional)</h4>
                    <p class="muted">If the metadata key already has data saved in the form of an object or array, you can define a path (using dot notation) to a specific property or index to update with the above data. If nothing is provided, the entire metadata entry is replaced. If there is no existing data and a property path is provided, nothing happens.</p>
                    <eos-collapsable-panel show-label="Show examples" hide-label="Hide examples" hide-info-box="true">
                        <span>Examples:</span>
                        <ul>
                            <li>some.property</li>
                            <li>1</li>
                            <li>1.value</li>
                        </ul>
                    </eos-collapsable-panel>
                    <input ng-model="effect.propertyPath" type="text" class="form-control" id="propertyPath" placeholder="Enter path" replace-variables>
                </eos-collapsable-panel>
            </div>
        </eos-container>
    `,
    optionsController: ($scope) => {
        $scope.editors = [
            {
                label: "Basic",
                inputType: "text",
                useTextArea: true,
                placeholderText: "Enter text/data"
            },
            {
                label: "JSON",
                inputType: "codemirror",
                placeholderText: "Enter text/data",
                codeMirrorOptions: {
                    mode: { name: "javascript", json: true },
                    theme: 'blackboard',
                    lineNumbers: true,
                    autoRefresh: true,
                    showGutter: true
                }
            }
        ];

        $scope.initialEditorLabel = $scope.effect?.data?.startsWith("{") || $scope.effect?.data?.startsWith("[") ? "JSON" : "Basic";
    },
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
        const { username, key, data, propertyPath } = effect;

        const viewerMetadataManager = require("../../viewers/viewer-metadata-manager");

        await viewerMetadataManager.updateViewerMetadata(username, key, data, propertyPath);

        return true;
    }
};

module.exports = effect;
