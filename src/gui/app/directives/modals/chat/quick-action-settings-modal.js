"use strict";

(function() {
    angular.module("firebotApp")
        .component("quickActionSettingsModal", {
            template: `
            <div class="modal-header" style="text-align: center">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Quick Action Settings</h4>
            </div>
            <div class="modal-body py-8 px-14" ui-sortable="$ctrl.sortableOptions" ng-model="$ctrl.quickActions">
                <div ng-repeat="action in $ctrl.quickActions | orderBy: $ctrl.sortQuickActions track by $index">
                    <div class="mb-2 flex justify-between items-center">
                        <span style="font-weight: 900;">{{action.name}}</span>
                        <span class="mr-10" style="margin-left: auto">
                            <input
                                class="tgl tgl-light sr-only"
                                id="{{action.id}}"
                                type="checkbox"
                                aria-label="{{action.name}}"
                                ng-checked="$ctrl.settings[action.id].enabled"
                                ng-click="$ctrl.settings[action.id].enabled = !$ctrl.settings[action.id].enabled"
                            />
                            <label class="tgl-btn" for="{{action.id}}"></label>
                        </span>
                        <span
                            class="dragHandle"
                            ng-click="$event.stopPropagation();"
                        >
                            <i class="fal fa-bars" aria-hidden="true"></i>
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
                $ctrl.settings = [];

                $ctrl.$onInit = () => {
                    $ctrl.quickActions = $ctrl.resolve.quickActions;
                    $ctrl.settings = $ctrl.resolve.settings;
                };

                $ctrl.sortQuickActions = (qa) => {
                    return $ctrl.settings[qa.id].position;
                };

                $ctrl.sortableOptions = {
                    handle: ".dragHandle",
                    stop: () => {
                        $ctrl.quickActions.forEach((qa, index) => {
                            $ctrl.settings[qa.id].position = index;
                        });
                    }
                };
            }
        });
}());
