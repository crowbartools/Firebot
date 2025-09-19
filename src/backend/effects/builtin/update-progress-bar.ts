import { EffectType } from "../../../types/effects";
import { EffectCategory } from '../../../shared/effect-constants';
import overlayWidgetConfigManager from "../../overlay-widgets/overlay-widget-config-manager";
import logger from "../../logwrapper";

const model: EffectType<{
    progressBarWidgetId: string;
    mode: "increment" | "set";
    value: string;
}> = {
    definition: {
        id: "firebot:update-progress-bar",
        name: "Update Progress Bar",
        description: "Update a progress bar's value.",
        icon: "fad fa-percentage",
        categories: [EffectCategory.COMMON, EffectCategory.ADVANCED],
        dependencies: []
    },
    optionsTemplate: `
        <div ng-hide="hasProgressBarWidgets">
            <p>You need to create a Progress Bar Overlay Widget to use this effect! Go to the <b>Overlay Widgets</b> tab to create one.</p>
        </div>
        <div ng-show="hasProgressBarWidgets">
            <eos-container header="Progress Bar">
                <firebot-searchable-select
                    ng-model="effect.progressBarWidgetId"
                    placeholder="Select or search for a progress bar..."
                    items="progressBarWidgets"
                />
            </eos-container>

            <div ng-show="effect.progressBarWidgetId">
                <eos-container header="Mode" pad-top="true">
                    <div class="controls-fb" style="padding-bottom: 5px;">
                        <label class="control-fb control--radio">Increment <tooltip text="'Increment the progress bar by the given value (value can be negative to decrement)'"></tooltip>
                            <input type="radio" ng-model="effect.mode" value="increment"/>
                            <div class="control__indicator"></div>
                        </label>
                        <label class="control-fb control--radio">Set <tooltip text="'Set the progress bar to a new value.'"></tooltip>
                            <input type="radio" ng-model="effect.mode" value="set"/>
                            <div class="control__indicator"></div>
                        </label>
                    </div>
                </eos-container>
            </div>

            <eos-container header="{{effect.mode == 'increment' ? 'Increment Amount' : 'New Value'}}" pad-top="true" ng-show="effect.mode">
                <div class="input-group">
                    <span class="input-group-addon" id="delay-length-effect-type">Value</span>
                    <input ng-model="effect.value" type="text" class="form-control" aria-describedby="delay-length-effect-type" type="text" replace-variables="number">
                </div>
            </eos-container>
        </div>
    `,
    optionsController: ($scope, overlayWidgetsService) => {

        $scope.progressBarWidgets = overlayWidgetsService.getOverlayWidgetConfigsByType("firebot:progressbar");

        $scope.hasProgressBarWidgets = $scope.progressBarWidgets.length > 0;
    },
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.progressBarWidgetId == null) {
            errors.push("Please select a progress bar.");
        } else if (effect.mode == null) {
            errors.push("Please select an update mode.");
        } else if (effect.value === undefined || effect.value === "") {
            errors.push("Please enter an update value.");
        }

        return errors;
    },
    getDefaultLabel: (effect, overlayWidgetsService) => {
        const progressBarName = overlayWidgetsService.getOverlayWidgetConfig(effect.progressBarWidgetId)?.name ?? "Unknown Progress Bar";
        return `${effect.mode === "increment" ? "Update" : "Set"} ${progressBarName} ${effect.mode === "increment" ? "by" : "to"} ${effect.value}`;
    },
    onTriggerEvent: async (event) => {
        const { effect } = event;

        if (effect.progressBarWidgetId == null || effect.mode == null || effect.value == null) {
            return false;
        }

        const value = parseInt(effect.value);

        if (isNaN(value)) {
            logger.warn(`Failed to update Progress Bar ${effect.progressBarWidgetId} because ${effect.value} is not a number.`);
            return false;
        }

        const progressBarWidget = overlayWidgetConfigManager.getItem(effect.progressBarWidgetId);
        if (!progressBarWidget) {
            logger.warn(`Failed to update Progress Bar ${effect.progressBarWidgetId} because it does not exist.`);
            return false;
        }

        const currentValue = progressBarWidget.state?.currentValue as number ?? 0;

        overlayWidgetConfigManager.setWidgetStateById(effect.progressBarWidgetId, {
            ...progressBarWidget.state,
            currentValue: effect.mode === "increment" ? currentValue + value : value
        });

        return true;
    }
};

export = model;