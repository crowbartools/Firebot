"use strict";

(function() {

    angular
        .module("firebotApp")
        .component("removePluginModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.cancel()"><span>&times;</span></button>
                <h4 class="modal-title">Remove Plugin</h4>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to remove "<b>{{$ctrl.pluginName}}</b>"?</p>
                <firebot-checkbox
                    label="Also delete the plugin file from the scripts folder"
                    model="$ctrl.deletePluginFile"
                ></firebot-checkbox>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.cancel()">Cancel</button>
                <button type="button" class="btn btn-danger" ng-click="$ctrl.confirm()">Remove</button>
            </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function() {
                const $ctrl = this;

                $ctrl.pluginName = "";
                $ctrl.deletePluginFile = false;

                $ctrl.$onInit = function() {
                    $ctrl.pluginName = $ctrl.resolve.pluginName;
                };

                $ctrl.confirm = function() {
                    $ctrl.close({
                        $value: {
                            confirmed: true,
                            deletePluginFile: $ctrl.deletePluginFile === true
                        }
                    });
                };

                $ctrl.cancel = function() {
                    $ctrl.dismiss();
                };
            }
        });
}());
