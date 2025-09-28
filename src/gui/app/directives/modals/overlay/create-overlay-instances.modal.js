"use strict";

(function() {
    angular.module("firebotApp")
        .component("createOverlayInstancesModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">Create Overlay Instance</h4>
                </div>
                <div class="modal-body">
                    <div class="mt-6" style="display: flex;flex-direction: column;justify-content: center;align-items: center;">
                    <div style="width: 75%; position: relative;">
                        <div class="form-group" ng-class="{'has-error': createError}">
                        <label class="control-label" for="name">Name</label>
                        <input type="text" class="form-control" id="name" ng-model="$ctrl.name" aria-describedby="helpBlock">
                        <span id="helpBlock" class="help-block" ng-show="createError">This name is invalid or already exists.</span>
                        </div>
                    </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.create()">Create</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(settingsService) {
                const $ctrl = this;

                $ctrl.name = "";

                $ctrl.create = () => {
                    if (
                        settingsService
                            .getSetting("OverlayInstances")
                            .includes($ctrl.name) || $ctrl.name === ""
                    ) {
                        $ctrl.createError = true;
                        return;
                    }

                    $ctrl.close({
                        $value: {
                            instanceName: $ctrl.name
                        }
                    });
                };
            }
        });
}());