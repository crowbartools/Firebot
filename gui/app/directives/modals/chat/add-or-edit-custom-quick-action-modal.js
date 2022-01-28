"use strict";

(function() {
    const uuidv1 = require("uuid/v1");

    angular.module("firebotApp")
        .component("addOrEditCustomQuickActionModal", {
            template: `
                <div class="modal-header" style="text-align: center">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Edit Quick Actions</h4>
                </div>
                <div class="modal-body py-8 px-14">
                    <div class="mb-6">
                        <h3>Name</h3>
                        <p class="muted">The name will also be the tooltip when you hover the Quick Action.</p>
                        <input type="text" class="form-control" placeholder="Enter name" ng-model="$ctrl.quickAction.name" required>
                    </div>
                    <div class="mb-6">
                        <h3>Icon</h3>
                        <p class="muted">A custom icon which allows you to identify your Quick Action.</p>
                        <input maxlength="2" type="text" class="form-control" ng-model="$ctrl.quickAction.icon" iconpicker required>
                    </div>
                    <div>
                        <h3>Effect list</h3>
                        <p class="muted">The effect list that will be run when the Quick Action is triggered.</p>
                        <ui-select ng-model="$ctrl.quickAction.presetListId" theme="bootstrap"  on-select="presetListSelected($item)">
                            <ui-select-match placeholder="Select or search for a preset effect list... ">{{$select.selected.name}}</ui-select-match>
                            <ui-select-choices repeat="presetList.id as presetList in $ctrl.presetEffectLists | filter: { name: $select.search }" style="position:relative;">
                                <div ng-bind-html="presetList.name | highlight: $select.search"></div>
                            </ui-select-choices>
                        </ui-select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(presetEffectListsService, customQuickActionsService, settingsService, ngToast) {
                const $ctrl = this;

                $ctrl.presetEffectLists = presetEffectListsService.getPresetEffectLists();
                $ctrl.settings = settingsService.getQuickActionSettings();

                $ctrl.quickAction = {
                    id: null,
                    name: "",
                    type: "custom",
                    icon: "far fa-magic",
                    presetListId: ""
                };

                $ctrl.presetListSelected = (presetList) => {
                    $ctrl.quickAction.presetListId = presetList.id;
                };

                $ctrl.$onInit = () => {
                    if ($ctrl.resolve.quickAction != null) {
                        $ctrl.quickAction = JSON.parse(angular.toJson($ctrl.resolve.quickAction));
                    } else {
                        $ctrl.isNewQuickAction = true;
                    }

                    if ($ctrl.isNewQuickAction && $ctrl.quickAction.id == null) {
                        $ctrl.quickAction.id = uuidv1();

                        $ctrl.settings[$ctrl.quickAction.id] = {
                            enabled: true,
                            position: Object.values($ctrl.settings).length + 1
                        };
                    }
                };

                $ctrl.save = function() {
                    if ($ctrl.quickAction.name == null || $ctrl.quickAction.name === "") {
                        ngToast.create("Please provide a name for this Quick Action");
                        return;
                    }

                    if ($ctrl.quickAction.icon == null || $ctrl.quickAction.icon === "") {
                        $ctrl.quickActions.icon = "far fa-magic";
                        return;
                    }

                    customQuickActionsService.saveCustomQuickAction($ctrl.quickAction).then(successful => {
                        if (successful) {
                            settingsService.setQuickActionSettings($ctrl.settings);
                            $ctrl.close();
                        } else {
                            ngToast.create("Failed to save custom quick action. Please try again or view logs for details.");
                        }
                    });
                };
            }
        });
}());
