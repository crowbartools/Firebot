"use strict";

(function() {
    angular.module("firebotApp")
        .component("addOrEditMetadataModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">{{$ctrl.isNew ? 'Add' : 'Edit'}} Metadata</h4>
                </div>
                <div class="modal-body">

                    <form name="metadataInfo">

                        <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('key')}">
                            <label for="key" class="control-label">Key</label>
                            <input
                                ng-if="$ctrl.isNew"
                                type="text"
                                id="key"
                                name="key"
                                class="form-control input-lg"
                                placeholder="Enter key"
                                ng-model="$ctrl.metadata.key"
                                ui-validate="'$value != null && $value.length > 0'"
                                required
                                disable-variables="true"
                            />
                            <div style="font-size: 18px; font-weight: bold;" ng-if="!$ctrl.isNew">{{$ctrl.metadata.key}}</div>
                        </div>

                        <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('value')}">
                            <label for="value" class="control-label">Data</label>
                            <selectable-input-editors
                                editors="editors"
                                initial-editor-label="initialEditorLabel"
                                model="$ctrl.metadata.value"
                            />
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($scope) {
                const $ctrl = this;

                $scope.$watch("type", (newValue) => {
                    if (newValue === "json") {
                        $ctrl.metadata.value = ($ctrl.metadata.value || "").toString();
                    }
                });

                $scope.editors = [
                    {
                        label: "Text",
                        inputType: "text",
                        placeholderText: "Enter value",
                        disableVariables: true
                    },
                    {
                        label: "Number",
                        inputType: "number",
                        placeholderText: "Enter value",
                        disableVariables: true,
                        forceInput: true
                    },
                    {
                        label: "JSON",
                        inputType: "codemirror",
                        disableVariables: true,
                        codeMirrorOptions: {
                            mode: {name: "javascript", json: true},
                            theme: 'blackboard',
                            lineNumbers: true,
                            autoRefresh: true,
                            showGutter: true
                        }
                    }
                ];

                $ctrl.isNew = true;

                $ctrl.metadata = {
                    key: "",
                    value: ""
                };

                $ctrl.formFieldHasError = (fieldName) => {
                    if ($scope.metadataInfo[fieldName] == null) {
                        return false;
                    }
                    return ($scope.metadataInfo.$submitted || $scope.metadataInfo[fieldName].$touched)
                        && $scope.metadataInfo[fieldName].$invalid;
                };

                $ctrl.$onInit = () => {
                    if ($ctrl.resolve.metadata != null) {
                        $ctrl.metadata.key = $ctrl.resolve.metadata.key;
                        $ctrl.metadata.value = $ctrl.resolve.metadata.value;

                        $ctrl.isNew = false;

                        const valueType = typeof $ctrl.metadata.value;
                        if (valueType === "number") {
                            $scope.initialEditorLabel = "Number";
                        } else if (valueType === "object") {
                            $ctrl.metadata.value = JSON.stringify($ctrl.metadata.value, null, 4);
                            $scope.initialEditorLabel = "JSON";
                        } else {
                            $scope.initialEditorLabel = "Text";
                        }
                    }
                };

                $ctrl.save = () => {
                    $scope.metadataInfo.$setSubmitted();
                    if ($scope.metadataInfo.$invalid) {
                        return;
                    }

                    $ctrl.close({
                        $value: $ctrl.metadata
                    });
                };
            }
        });
}());
