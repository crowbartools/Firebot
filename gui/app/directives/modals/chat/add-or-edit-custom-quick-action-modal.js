"use strict";

(function() {
    const uuidv1 = require("uuid/v1");

    angular.module("firebotApp")
        .component("addOrEditCustomQuickActionModal", {
            template: `
                <div class="modal-header" style="text-align: center">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Edit Quick Action</h4>
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
                        <input maxlength="2" type="text" class="form-control" ng-model="$ctrl.quickAction.icon" icon-picker required>
                    </div>
                    <div>
                        <h3>Effect list</h3>
                        <p class="muted">The effect list that will be run when the Quick Action is triggered.</p>
                        <dropdown-select options="{ custom: 'Custom', preset: 'Preset'}" selected="$ctrl.listType"></dropdown-select>
                        <div ng-if="$ctrl.listType === 'preset'" class="mt-8">
                            <ui-select ng-model="$ctrl.quickAction.presetListId" theme="bootstrap" on-select="presetListSelected($item)">
                                <ui-select-match placeholder="Select or search for a preset effect list... ">{{$select.selected.name}}</ui-select-match>
                                <ui-select-choices repeat="presetList.id as presetList in $ctrl.presetEffectLists | filter: { name: $select.search }" style="position:relative;">
                                    <div ng-bind-html="presetList.name | highlight: $select.search"></div>
                                </ui-select-choices>
                            </ui-select>
                        </div>
                        <div ng-if="$ctrl.listType === 'custom'" class="mt-8">
                            <effect-list effects="$ctrl.quickAction.effectList"
                                trigger="{{'quick_action'}}"
                                trigger-meta="$ctrl.triggerMeta"
                                update="$ctrl.effectListUpdated(effects)"
                                modalId="{{modalId}}"
                            ></effect-list>
                        </div>
                    </div>
                </div>
                <div class="modal-footer sticky-footer">
                    <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(presetEffectListsService, quickActionsService, settingsService, ngToast) {
                const $ctrl = this;

                $ctrl.presetEffectLists = presetEffectListsService.getPresetEffectLists().map(pel => ({id: pel.id, name: pel.name}));
                $ctrl.settings = settingsService.getQuickActionSettings();
                $ctrl.listType = "custom";
                $ctrl.triggerMeta = {};

                $ctrl.effectListUpdated = (effects) => {
                    $ctrl.quickAction.effectList = effects;
                };

                $ctrl.quickAction = {
                    id: null,
                    name: "",
                    type: "custom",
                    icon: "far fa-magic",
                    presetListId: null,
                    effectList: null
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

                    $ctrl.listType = $ctrl.quickAction.presetListId != null ? "preset" : "custom";
                };

                $ctrl.save = function() {
                    if ($ctrl.quickAction.name == null || $ctrl.quickAction.name === "") {
                        ngToast.create("Please provide a name for this Quick Action");
                        return;
                    }

                    if (
                        ($ctrl.quickAction.presetListId == null || $ctrl.quickAction.presetListId === "") &&
                        ($ctrl.quickAction.effectList == null || !$ctrl.quickAction.effectList.list.length)
                    ) {
                        ngToast.create("Please select a Custom or Preset Effect List for this Quick Action");
                        return;
                    }

                    if ($ctrl.quickAction.presetListId != null && $ctrl.listType === 'preset') {
                        $ctrl.quickAction.effectList = null;
                    }

                    if ($ctrl.quickAction.effectList != null && $ctrl.listType === 'custom') {
                        $ctrl.quickAction.presetListId = null;
                    }

                    if ($ctrl.quickAction.icon == null || $ctrl.quickAction.icon === "") {
                        $ctrl.quickAction.icon = "far fa-magic";
                    }

                    quickActionsService.saveCustomQuickAction($ctrl.quickAction).then(successful => {
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
