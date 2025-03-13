"use strict";

(function() {
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
                            <firebot-searchable-select
                                ng-model="$ctrl.quickAction.presetListId"
                                items="$ctrl.presetEffectLists"
                                placeholder="Select or search for a preset effect list..."
                                on-select="$ctrl.presetListSelected(item)"
                            />
                        </div>
                        <div ng-if="$ctrl.listType === 'custom'" class="mt-8">
                            <effect-list effects="$ctrl.quickAction.effectList"
                                trigger="quick_action"
                                trigger-meta="$ctrl.triggerMeta"
                                update="$ctrl.effectListUpdated(effects)"
                                modalId="{{modalId}}"
                            ></effect-list>
                        </div>
                    </div>
                    <div ng-if="$ctrl.listType === 'preset' && $ctrl.currentPresetArgs.length > 0">
                        <h3>Arguments</h3>
                        <div style="margin: 15px 0;display:flex;align-items:center;">
                            <toggle-button
                                toggle-model="$ctrl.quickAction.promptForArgs"
                                auto-update-value="true"
                                style="display:inline-block;"
                            />
                            <span class="ml-2">
                                Prompt for args when quick action triggered
                            </span>
                        </div>
                        <div ng-if="!$ctrl.quickAction.promptForArgs">
                            <div
                                ng-repeat="arg in $ctrl.currentPresetArgs"
                                style="margin-bottom: 20px;"
                            >
                                <div style="font-size: 15px;font-weight: 600;margin-bottom:5px;">
                                    {{arg.name}}
                                </div>
                                <firebot-input
                                    model="$ctrl.quickAction.presetArgValues[arg.name]"
                                    input-type="string"
                                    disable-variables="true"
                                    placeholder-text="Enter value"
                                />
                            </div>
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
            controller: function(presetEffectListsService, quickActionsService, ngToast) {
                const $ctrl = this;

                $ctrl.presetEffectLists = presetEffectListsService.getPresetEffectLists();
                $ctrl.listType = "custom";

                $ctrl.effectListUpdated = (effects) => {
                    $ctrl.quickAction.effectList = effects;
                };

                $ctrl.quickAction = {
                    id: null,
                    name: "",
                    type: "custom",
                    icon: "far fa-magic",
                    presetListId: null,
                    presetArgValues: {},
                    promptForArgs: false,
                    effectList: null
                };

                $ctrl.currentPresetArgs = [];

                $ctrl.presetListSelected = (presetList) => {
                    $ctrl.currentPresetArgs = presetList.args || [];
                    $ctrl.quickAction.presetListId = presetList.id;
                    $ctrl.quickAction.presetArgValues = {};
                };

                $ctrl.$onInit = () => {
                    if ($ctrl.resolve.quickAction != null) {
                        $ctrl.quickAction = JSON.parse(angular.toJson($ctrl.resolve.quickAction));
                    } else {
                        $ctrl.isNewQuickAction = true;
                    }

                    $ctrl.triggerMeta = {
                        rootEffects: $ctrl.quickAction.effectList
                    };

                    $ctrl.listType = $ctrl.quickAction.presetListId != null ? "preset" : "custom";

                    if ($ctrl.listType === "preset") {
                        const list = $ctrl.presetEffectLists.find(l => l.id === $ctrl.quickAction.presetListId);
                        $ctrl.currentPresetArgs = list?.args || [];
                    }
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

                    quickActionsService.saveCustomQuickAction($ctrl.quickAction).then((successful) => {
                        if (successful) {
                            $ctrl.close();
                        } else {
                            ngToast.create("Failed to save custom quick action. Please try again or view logs for details.");
                        }
                    });
                };
            }
        });
}());
