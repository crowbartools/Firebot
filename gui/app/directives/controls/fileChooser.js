"use strict";

(function() {

    angular
        .module('firebotApp')
        .component("fileChooser", {
            bindings: {
                model: "=",
                options: "<",
                onUpdate: '&',
                hideManualEdit: "<"
            },
            template: `
            <div style="display: flex;flex-direction: row;align-items: center;">
                <button class="btn btn-default" ng-click="$ctrl.openFileExporer()">{{ $ctrl.isFile ? 'Choose File' : 'Choose Folder' }}</button>
                <span style="padding-left: 10px;font-size: 12px;max-width: 400px;text-overflow: ellipsis;overflow: hidden;white-space: nowrap;">{{$ctrl.model ? $ctrl.model : "No file selected."}}</span>
                <span ng-hide="$ctrl.hideManualEdit" class="clickable" style="margin-left: 10px" ng-click="$ctrl.editFilePath()" uib-tooltip="Edit filepath manually" tooltip-append-to-body="true"><i class="fal fa-edit"></i></span>
                <span ng-if="$ctrl.model != null && $ctrl.model !== ''" class="clickable" style="margin-left: 10px" ng-click="$ctrl.model = null"><i class="fal fa-times-circle"></i></span>
            </div>
            `,
            controller: function($scope, $q, backendCommunicator, utilityService) {
                const ctrl = this;

                ctrl.isFile = true;
                ctrl.$onInit = function() {
                    if (ctrl.options != null && ctrl.options.directoryOnly) {
                        ctrl.isFile = false;
                    }
                };

                ctrl.clearPath = function() {
                    ctrl.model = null;
                    ctrl.onUpdate({filepath: ''});
                };

                const { trigger, triggerMeta } = $scope.$parent;
                ctrl.editFilePath = function() {
                    utilityService.openGetInputModal(
                        {
                            model: ctrl.model,
                            label: "Edit File Path",
                            saveText: "Save",
                            validationFn: () => true,
                            trigger: trigger,
                            triggerMeta: triggerMeta
                        },
                        (path) => {
                            ctrl.model = path;
                            ctrl.onUpdate({filepath: path});
                        });
                };

                ctrl.openFileExporer = () => {
                    $q
                        .when(backendCommunicator.fireEventAsync("open-file-browser", {
                            options: ctrl.options,
                            currentPath: ctrl.model && ctrl.model !== "" ? ctrl.model : undefined
                        }))
                        .then(response => {
                            if (response.path == null) {
                                return;
                            }

                            ctrl.model = response.path;
                            ctrl.onUpdate({filepath: response.path});
                        });
                };
            }
        });
}());
