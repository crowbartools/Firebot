import { EffectType } from "../../../../types/effects";
import overlayWidgetConfigManager from "../../../overlay-widgets/overlay-widget-config-manager";
import logger from "../../../logwrapper";

const model: EffectType<{
    progressBarWidgetId: string;
    action: "increment" | "set";
    value: string;
}> = {
    definition: {
        id: "firebot:update-progress-bar",
        name: "Update Progress Bar",
        description: "Update a progress bar's value.",
        icon: "fad fa-percentage",
        categories: ["overlay", "advanced"],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container ng-hide="hasProgressBarWidgets">
            <p>You need to create a Progress Bar Overlay Widget to use this effect! Go to the <b>Overlay Widgets</b> tab to create one.</p>
        </eos-container>
        <div ng-show="hasProgressBarWidgets">
            <eos-container header="Progress Bar">
                <firebot-overlay-widget-select
                    overlay-widget-types="['firebot:progressbar']"
                    ng-model="effect.progressBarWidgetId"
                />
            </eos-container>

            <div ng-show="effect.progressBarWidgetId">
                <eos-container header="Action" pad-top="true">
                    <firebot-radio-cards
                        options="actions"
                        ng-model="effect.action"
                        grid-columns="2"
                    ></firebot-radio-cards>
                </eos-container>
            </div>

            <eos-container header="{{effect.action == 'increment' ? 'Increment Amount' : 'New Value'}}" pad-top="true" ng-show="effect.action">
                <firebot-input
                    input-title="Value"
                    model="effect.value"
                    placeholder-text="Enter value"
                    data-type="number"
                />
            </eos-container>
        </div>
    `,
    optionsController: ($scope, overlayWidgetsService) => {

        $scope.hasProgressBarWidgets = overlayWidgetsService.hasOverlayWidgetConfigsOfType("firebot:progressbar");

        $scope.actions = [
            {
                value: "increment",
                label: "Increment",
                iconClass: "fa-plus",
                description: "Increment the progress bar by the given value (use negative to decrement)"
            },
            {
                value: "set",
                label: "Set",
                iconClass: "fa-equals",
                description: "Set the progress bar to a new value."
            }
        ];
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (effect.progressBarWidgetId == null) {
            errors.push("Please select a progress bar.");
        } else if (effect.action == null) {
            errors.push("Please select an update action.");
        } else if (effect.value === undefined || effect.value === "") {
            errors.push("Please enter an update value.");
        }

        return errors;
    },
    getDefaultLabel: (effect, overlayWidgetsService) => {
        const progressBarName = overlayWidgetsService.getOverlayWidgetConfig(effect.progressBarWidgetId)?.name ?? "Unknown Progress Bar";
        return `${effect.action === "increment" ? "Update" : "Set"} ${progressBarName} ${effect.action === "increment" ? "by" : "to"} ${effect.value}`;
    },
    onTriggerEvent: (event) => {
        const { effect } = event;

        if (effect.progressBarWidgetId == null || effect.action == null || effect.value == null) {
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
            currentValue: effect.action === "increment" ? currentValue + value : value
        });

        return true;
    }
};

export = model;