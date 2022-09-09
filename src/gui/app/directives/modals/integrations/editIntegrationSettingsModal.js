"use strict";

(function() {
    angular.module("firebotApp").component("editIntegrationUserSettingsModal", {
        template: `
            <div class="modal-header">
                <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">
                    <div style="font-size: 22px;">Configure Integration:</div>
                    <div style="font-weight:bold;font-size: 24px;">{{$ctrl.integration.name}}</div>
                </h4>
            </div>
            <div class="modal-body">

                <setting-container ng-if="$ctrl.integration.settingCategories != null" ng-repeat="categoryMeta in $ctrl.settingCategoriesArray | orderBy:'sortRank'"  header="{{categoryMeta.title}}" description="{{categoryMeta.description}}" pad-top="$index > 0 ? true : false" collapsed="false">
                    <command-option ng-repeat="setting in categoryMeta.settingsArray | orderBy:'sortRank'"
                                name="setting.settingName"
                                metadata="setting"></command-option>
                </setting-container>

            </div>
            <div class="modal-footer sticky-footer edit-integration-footer" style="margin-top:15px">
                <!--<button ng-show="$ctrl.integration != null" type="button" class="btn btn-danger pull-left" ng-click="$ctrl.resetToDefaults()">Reset to default</button>-->
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button ng-show="$ctrl.integration != null" type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
            </div>
            <scroll-sentinel element-class="edit-integration-footer"></scroll-sentinel>
            `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&"
        },
        controller: function(ngToast, utilityService) {
            const $ctrl = this;

            $ctrl.integration = null;

            $ctrl.settingCategoriesArray = [];

            $ctrl.$onInit = function() {
                if ($ctrl.resolve.integration) {
                    $ctrl.integration = JSON.parse(JSON.stringify($ctrl.resolve.integration));
                    $ctrl.settingCategoriesArray = Object.values($ctrl.integration.settingCategories)
                        .map(sc => {
                            sc.settingsArray = [];
                            const settingNames = Object.keys(sc.settings);
                            for (const settingName of settingNames) {
                                const setting = sc.settings[settingName];
                                setting.settingName = settingName;
                                sc.settingsArray.push(setting);
                            }
                            return sc;
                        });
                } else {
                    $ctrl.dismiss();
                }
            };

            $ctrl.resetToDefaults = () => {
                utilityService
                    .showConfirmationModal({
                        title: `Reset To Defaults`,
                        question: `Are you sure you want reset ${$ctrl.integration.name} to default settings?`,
                        confirmLabel: "Reset",
                        confirmBtnType: "btn-danger"
                    })
                    .then(confirmed => {
                        if (confirmed) {
                            $ctrl.close({
                                $value: {
                                    integrationId: $ctrl.integration.id,
                                    action: "reset"
                                }
                            });
                        }
                    });
            };

            function validate() {
                if ($ctrl.integration.settingCategories) {
                    for (const category of Object.values($ctrl.integration.settingCategories)) {
                        for (const setting of Object.values(category.settings)) {
                            if (setting.validation) {
                                if (setting.validation.required) {
                                    if (setting.type === 'string' && setting.value === "") {
                                        ngToast.create(`Please input a value for the ${setting.title} option`);
                                        return false;
                                    } else if (setting.type === 'editable-list' && (setting.value == null || setting.value.length === 0)) {
                                        ngToast.create(`Please input some text for the ${setting.title} option`);
                                        return false;
                                    } else if (setting.value === null || setting.value === undefined) {
                                        ngToast.create(`Please select/input a value for the ${setting.title} option`);
                                        return false;
                                    }
                                }
                                if (setting.type === "number") {
                                    if (!isNaN(setting.validation.min) && setting.value < setting.validation.min) {
                                        ngToast.create(`The value for the ${setting.title} option must be at least ${setting.validation.min}`);
                                        return false;
                                    }
                                    if (!isNaN(setting.validation.max) && setting.value > setting.validation.max) {
                                        ngToast.create(`The value for the ${setting.title} option must be no more than ${setting.validation.max}`);
                                        return false;
                                    }
                                }
                            }
                        }
                    }
                }
                return true;
            }

            $ctrl.save = () => {
                if (!validate()) {
                    return;
                }

                $ctrl.close({
                    $value: {
                        integration: $ctrl.integration,
                        action: "save"
                    }
                });
            };
        }
    });
}());
