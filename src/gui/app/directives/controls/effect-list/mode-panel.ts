"use strict";
import type {
    FirebotComponent,
    EffectList
} from "../../../../../types";
import type { DropdownOption } from "../firebot-dropdown";
import type { PreviewItem } from "./effect-config-panel";

type Bindings = {
    effectsData: EffectList;
    onUpdate: () => void;
    disabled?: boolean;
};

type Controller = {
    options: DropdownOption[];
    previewItems: PreviewItem[];
    mainValue: PreviewItem;
};

(function () {
    const modePanel: FirebotComponent<Bindings, Controller> = {
        bindings: {
            effectsData: "<",
            onUpdate: "&",
            disabled: "<?"
        },
        template: `
            <effect-config-panel
                icon="fa-running"
                label="Run Mode"
                tooltip="Determines how effects in this list are run when triggered."
                main-value="$ctrl.mainValue"
                preview-items="$ctrl.previewItems"
                disabled="$ctrl.disabled"
            >
                <div style="padding: 14px 0;">
                    <firebot-dropdown
                        ng-model="$ctrl.effectsData.runMode"
                        ng-change="$ctrl.onUpdate()"
                        options="$ctrl.options"
                        placeholder="Select run mode"
                        empty-message="No run modes available"
                        option-toggling="false"
                        dark="true"
                    />
                </div>

                <div class="config-panel-control" ng-if="$ctrl.effectsData.runMode === 'random'">
                    <div class="config-control-label">
                        <i class="far fa-weight-hanging"></i>
                        <span>Weighted Chances</span>
                        <tooltip text="'If enabled, effects will be chosen based on their assigned weights. If disabled, effects will be chosen randomly with equal chance.'"></tooltip>
                    </div>
                    <div>
                        <toggle-button
                            toggle-model="$ctrl.effectsData.weighted"
                            on-toggle="$ctrl.onUpdate()"
                            auto-update-value="true"
                            font-size="32"
                        ></toggle-button>
                    </div>
                </div>

                <div class="config-panel-control" ng-if="$ctrl.effectsData.runMode === 'random' && !$ctrl.effectsData.weighted">
                    <div class="config-control-label">
                        <i class="far fa-ban"></i>
                        <span>Don't Repeat</span>
                        <tooltip text="'If enabled, effects will not repeat until all effects have been used once.'"></tooltip>
                    </div>
                    <div>
                        <toggle-button
                            toggle-model="$ctrl.effectsData.dontRepeatUntilAllUsed"
                            on-toggle="$ctrl.onUpdate()"
                            auto-update-value="true"
                            font-size="32"
                        ></toggle-button>
                    </div>
                </div>
            </effect-config-panel>
        `,
        controller: function (
            $scope: angular.IScope
        ) {
            const $ctrl = this;

            $ctrl.options = [
                {
                    name: "All",
                    value: "all",
                    icon: "fa-sort-numeric-down",
                    tooltip: "Runs all effects in order from top to bottom."
                },
                {
                    name: "Sequential",
                    value: "sequential",
                    icon: "fa-repeat-1",
                    tooltip: "Runs the next effect in the list each time this triggers. Once all effects have been used, it will start over from the beginning."
                },
                {
                    name: "Random",
                    value: "random",
                    icon: "fa-random",
                    tooltip: "Runs a random effect from the list each time this triggers."
                }
            ];

            $ctrl.previewItems = [];

            function updatePreviewItems() {

                const runModeOption = $ctrl.options.find(opt => opt.value === $ctrl.effectsData?.runMode) ?? $ctrl.options[0];
                $ctrl.mainValue = {
                    icon: runModeOption.icon,
                    label: runModeOption.name,
                    tooltip: runModeOption.tooltip
                };

                const items: PreviewItem[] = [];

                if ($ctrl.effectsData?.runMode === "random") {
                    if ($ctrl.effectsData?.weighted) {
                        items.push({
                            icon: "fa-weight-hanging",
                            label: "Weighted",
                            tooltip: "Using Weighted Chances"
                        });
                    } else if ($ctrl.effectsData?.dontRepeatUntilAllUsed) {
                        items.push({
                            icon: "fa-ban",
                            label: "No Repeats",
                            tooltip: "Won't repeat effects until all have been used once"
                        });
                    }
                }

                $ctrl.previewItems = items;
            }

            updatePreviewItems();

            $scope.$watchGroup(
                [
                    () => $ctrl.effectsData?.runMode,
                    () => $ctrl.effectsData?.weighted,
                    () => $ctrl.effectsData?.dontRepeatUntilAllUsed
                ],
                updatePreviewItems
            );
        }
    };

    // @ts-ignore
    angular.module("firebotApp").component("modePanel", modePanel);
})();
