"use strict";

(function() {
    angular.module("firebotApp")
        .component("quickActionSettingsModal", {
            template: `
            <div class="modal-header" style="text-align: center">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Quick Action Settings</h4>
            </div>
            <div class="modal-body py-8 px-14">
                <div ng-repeat="header in $ctrl.headers" class="mb-10">
                    <h4>{{header}}</h4>
                    <div ng-repeat="action in $ctrl.quickActions">
                        <div style="display: flex;align-items: center;justify-content: space-between;margin-bottom:5px;" ng-if="header.toLowerCase() === action.type">
                            <span style="font-weight: 900;">{{action.name}}</span>
                            <span>
                                <input
                                    class="tgl tgl-light sr-only"
                                    id="{{action.id}}"
                                    type="checkbox"
                                    aria-label="{{action.name}}"
                                    ng-checked="$ctrl.settings[action.id].enabled"
                                    ng-click="$ctrl.settings[action.id].enabled = !$ctrl.settings[action.id].enabled"/>
                                <label class="tgl-btn" for="{{action.id}}"></label>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function() {
                const $ctrl = this;

                $ctrl.quickActions = [];

                $ctrl.headers = ["System", "Custom"];

                $ctrl.$onInit = () => {
                    $ctrl.quickActions = $ctrl.resolve.quickActions;
                    $ctrl.settings = $ctrl.resolve.settings;
                };
            }
        });
}());
