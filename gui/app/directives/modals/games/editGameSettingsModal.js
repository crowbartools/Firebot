"use strict";

(function() {
    angular.module("firebotApp").component("editGameSettingsModal", {
        template: `
            <div class="modal-header">
                <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">
                    <div style="font-size: 22px;">Edit Game:</div>
                    <div style="font-weight:bold;font-size: 24px;">{{$ctrl.game.name}}</div>
                </h4>
            </div>
            <div class="modal-body">

                <setting-container ng-if="$ctrl.game.description">
                    <p>{{$ctrl.game.description}}</p>
                </setting-container>

                <setting-container>
                    <div class="controls-fb-inline" style="margin-bottom: 12px;">
                        <label class="control-fb control--checkbox">Enabled
                            <input type="checkbox" ng-model="$ctrl.game.active" aria-label="...">
                            <div class="control__indicator"></div>
                        </label>
                    </div>
                </setting-container>

                <setting-container ng-if="$ctrl.game.settingCategories != null" ng-repeat="categoryMeta in $ctrl.settingCategoriesArray | orderBy:'sortRank'"  header="{{categoryMeta.title}}" description="{{categoryMeta.description}}" pad-top="$index > 0 ? true : false">
                    <command-option ng-repeat="(optionName, optionMetadata) in categoryMeta.settings"
                                name="optionName"
                                metadata="optionMetadata"></command-option>
                </setting-container>

            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
            </div>
            `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&"
        },
        controller: function(ngToast) {
            let $ctrl = this;

            $ctrl.game = null;

            $ctrl.settingCategoriesArray = [];

            $ctrl.$onInit = function() {
                if ($ctrl.resolve.game) {
                    $ctrl.game = JSON.parse(JSON.stringify($ctrl.resolve.game));
                    $ctrl.settingCategoriesArray = Object.values($ctrl.game.settingCategories);
                } else {
                    $ctrl.dismiss();
                }
            };

            function validate() {
                if ($ctrl.game.settingCategories) {
                    for (let category of Object.values($ctrl.game.settingCategories)) {
                        for (let setting of Object.values(category.settings)) {
                            if (setting.validation) {
                                if (setting.validation.required) {
                                    if (setting.type === 'string' && setting.value === "") {
                                        ngToast.create(`Please input a value for the ${setting.title} option`);
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
                if (!validate()) return;
                $ctrl.close({
                    $value: $ctrl.game
                });
            };
        }
    });
}());
