"use strict";

(function() {

    const { v4: uuid } = require("uuid");

    angular.module("firebotApp")
        .component("addOrEditStartupScriptModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">{{$ctrl.isNewScript ? "Add New" : "Edit"}} Startup Script</h4>
            </div>
            <div class="modal-body">
                <div style="margin-top: 20px;">
                    <custom-script-settings
                        effect="$ctrl.scriptData"
                        modal-id="null"
                        trigger="'startup_script'"
                        allow-startup="true"
                    />
                </div>

            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
            </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(startupScriptsService, ngToast) {

                const $ctrl = this;

                $ctrl.sss = startupScriptsService;

                $ctrl.isNewScript = true;
                $ctrl.scriptData = { name: null };

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
                        $ctrl.scriptData.id = uuid();
                    }

                    $ctrl.close({
                        $value: {
                            scriptData: $ctrl.scriptData
                        }
                    });
                };
            }
        });
}());
