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
                        <p class="muted">The name will also be used as the tooltip.</p>
                        <input type="text" class="form-control" placeholder="Enter name" ng-model="$ctrl.quickAction.name">
                    </div>
                    <div class="mb-6">
                        <h3>Label</h3>
                        <p class="muted">Maximum of 2 letters. This will be on the button instead of the icon on a system quick action.</p>
                        <input maxlength="2" type="text" class="form-control" placeholder="Enter name" ng-model="$ctrl.quickAction.label">
                    </div>
                    <div>
                        <h3>Effect list</h3>
                        <p class="muted">The effect list that will be run when the quick action is triggered.</p>
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
                    label: "",
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
