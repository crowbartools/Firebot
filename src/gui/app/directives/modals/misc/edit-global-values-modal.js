"use strict";

(function() {
    angular.module("firebotApp")
        .component("editGlobalValuesModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">
                        Global Values
                    </h4>
                </div>
                <div class="modal-body firebot-list-container">
                    <div class="firebot-list-description">
                        <p class="muted" style="margin: 0 0 20px 0; font-size: 13px;">
                            <i class="fas fa-info-circle" style="margin-right: 6px;"></i>
                            Static values that are available throughout Firebot via a variable. Useful for reusing common values (e.g., API keys).
                        </p>
                    </div>

                    <div class="firebot-list">
                        <div ng-repeat="value in $ctrl.globalValues track by value.name" class="firebot-list-item">
                            <div class="firebot-list-item-header">
                                <div class="firebot-list-item-info">
                                    <span class="firebot-list-item-name">{{value.name}}</span>
                                </div>
                                <div class="firebot-list-item-actions">
                                    <button class="btn btn-default btn-sm"
                                            ng-click="$ctrl.addOrEditGlobalValue(value)"
                                            title="Edit global value">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-danger btn-sm"
                                            ng-click="$ctrl.removeGlobalValue(value)"
                                            title="Delete global value">
                                        <i class="far fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-primary btn-sm" style="width: 100%;" ng-click="$ctrl.addOrEditGlobalValue()">
                        <i class="fas fa-plus" style="margin-right: 6px;"></i>
                        Create Global Value
                    </button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(settingsService, modalService) {
                const $ctrl = this;

                $ctrl.globalValues = settingsService.getSetting("GlobalValues") ?? [];

                $ctrl.removeGlobalValue = (globalValue) => {
                    $ctrl.globalValues = $ctrl.globalValues.filter(v => v.name !== globalValue.name);
                    settingsService.saveSetting("GlobalValues", $ctrl.globalValues);
                };

                $ctrl.addOrEditGlobalValue = (globalValue = undefined) => {
                    modalService.showModal({
                        component: "addOrEditGlobalValueModal",
                        size: "sm",
                        resolveObj: {
                            globalValue: () => globalValue
                        },
                        closeCallback: (data) => {
                            if (data) {
                                const { globalValue, isNew, previous } = data;
                                if (isNew) {
                                    $ctrl.globalValues.push(globalValue);
                                } else {
                                    const index = $ctrl.globalValues.findIndex(v => v.name === previous.name);
                                    if (index !== -1) {
                                        $ctrl.globalValues[index] = globalValue;
                                    }
                                }
                                settingsService.saveSetting("GlobalValues", $ctrl.globalValues);
                            }
                        }
                    });
                };
            }
        });
}());