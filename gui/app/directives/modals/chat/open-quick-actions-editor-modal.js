"use strict";

(function() {
    angular.module("firebotApp")
        .component("quickActionsEditorModal", {
            template: `
            <div class="modal-header" style="text-align: center">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Edit Quick Actions</h4>
            </div>
            <div class="modal-body py-8 px-14">
                <div ng-repeat="action in $ctrl.quickActions | orderBy:'name' | filter:eventSearch" ng-if="$ctrl.quickActions.length > 0">
                    <div style="display: flex;align-items: center;justify-content: space-between;margin-bottom:5px;">
                        <span style="font-weight: 900;">{{action.name}}</span>
                        <span>
                            <input
                                class="tgl tgl-light sr-only"
                                id="{{action.id}}"
                                type="checkbox"
                                aria-label="{{action.name}}"
                                ng-checked="action.enabled"
                                ng-click="action.enabled = !action.enabled"/>
                            <label class="tgl-btn" for="{{action.id}}"></label>
                        </span>
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

                $ctrl.$onInit = () => {
                    $ctrl.quickActions = $ctrl.resolve.quickActions;
                };
            }
        });
}());
