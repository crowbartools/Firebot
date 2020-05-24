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

                <setting-container>
                    <div class="controls-fb-inline" style="margin-bottom: 12px;">
                        <label class="control-fb control--checkbox">Enabled
                            <input type="checkbox" ng-model="$ctrl.game.active" aria-label="...">
                            <div class="control__indicator"></div>
                        </label>
                    </div>
                </setting-container>

                <setting-container ng-if="$ctrl.game.settingCategories != null" ng-repeat="(categoryId, categoryMeta) in $ctrl.game.settingCategories"  header="{{categoryMeta.title}}" description="{{categoryMeta.description}}" pad-top="$index > 0 ? true : false">
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
        controller: function() {
            let $ctrl = this;

            $ctrl.game = null;

            $ctrl.$onInit = function() {
                if ($ctrl.resolve.game) {
                    $ctrl.game = JSON.parse(JSON.stringify($ctrl.resolve.game));
                } else {
                    $ctrl.dismiss();
                }
            };

            $ctrl.save = () => {
                $ctrl.close({
                    $value: $ctrl.game
                });
            };
        }
    });
}());
