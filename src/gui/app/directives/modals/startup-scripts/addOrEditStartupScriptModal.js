"use strict";

(function() {

    const { randomUUID } = require("crypto");

    angular.module("firebotApp")
        .component("addOrEditStartupScriptModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-hide="$ctrl.scriptIsInitializing" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">{{$ctrl.isNewScript ? "Add New" : "Edit"}} Startup Script</h4>
            </div>
            <div class="modal-body">
                <div style="margin-top: 20px;" ng-if="!$ctrl.scriptIsInitializing">
                    <custom-script-settings
                        effect="$ctrl.scriptData"
                        modal-id="null"
                        trigger="'startup_script'"
                        allow-startup="true"
                        is-new-startup="$ctrl.isNewScript"
                        init-first="$ctrl.initFirst"
                    />
                </div>
                <eos-container ng-if="$ctrl.scriptIsInitializing">
                    <i>Initializing script...</i>
                </eos-container>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-link" ng-hide="$ctrl.scriptIsInitializing" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()" ng-disabled="$ctrl.scriptIsInitializing">{{ $ctrl.initFirst ? "Add & Configure" : "Save" }}</button>
            </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(startupScriptsService, ngToast) {

                const $ctrl = this;

                $ctrl.isNewScript = true;
                $ctrl.scriptData = { name: null };

                $ctrl.initFirst = false;

                $ctrl.scriptIsInitializing = false;

                $ctrl.$onInit = function() {
                    if ($ctrl.resolve.scriptData) {
                        $ctrl.scriptData = JSON.parse(angular.toJson($ctrl.resolve.scriptData));
                        $ctrl.isNewScript = false;
                    }
                };

                $ctrl.save = () => {
                    if ($ctrl.scriptData.scriptName == null || $ctrl.scriptData.scriptName.length < 1) {
                        ngToast.create("Please select a script.");
                        return;
                    }

                    if ($ctrl.isNewScript) {
                        $ctrl.scriptData.id = randomUUID();
                    }

                    if ($ctrl.initFirst) {
                        $ctrl.scriptIsInitializing = true;
                        startupScriptsService.saveStartupScriptData($ctrl.scriptData).then(() => {
                            $ctrl.initFirst = false;
                            $ctrl.isNewScript = false;
                            $ctrl.scriptIsInitializing = false;
                        });
                    } else {
                        $ctrl.close({
                            $value: {
                                scriptData: $ctrl.scriptData
                            }
                        });
                    }
                };
            }
        });
}());
