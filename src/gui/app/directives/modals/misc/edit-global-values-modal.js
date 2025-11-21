"use strict";

(function() {
    angular.module("firebotApp")
        .component("editGlobalValuesModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">Global Values</h4>
                </div>
                <div class="modal-body">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr ng-repeat="value in $ctrl.globalValues track by value.name">
                                <td>{{value.name}}</td>
                                <td>
                                    <div class="flex items-center justify-end" style="gap: 10px;">
                                        <span class="clickable" ng-click="$ctrl.addOrEditGlobalValue(value)"><i class="far fa-edit"></i></span>
                                        <span class="effect-delete-btn clickable" ng-click="$ctrl.removeGlobalValue(value)"><i class="far fa-trash-alt"></i></span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <button class="btn btn-default btn-sm" ng-click="$ctrl.addOrEditGlobalValue()">+ Create Global Value</button>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.dismiss()">Done</button>
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