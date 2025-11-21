import { EffectType } from "../../../../types/effects";
import overlayWidgetConfigManager from "../../../overlay-widgets/overlay-widget-config-manager";
import logger from "../../../logwrapper";
import type { DynamicCountdownWidgetConfig } from "../../../overlay-widgets/builtin-types/countdown/countdown-dynamic";
import countdownManager from "../../../overlay-widgets/builtin-types/countdown/countdown-manager";

const model: EffectType<{
    countdownWidgetId: string;
    action: "add" | "subtract" | "set" | "change-mode";
    mode?: "running" | "paused" | "toggle";
    value?: string;
    startIfPaused?: boolean;
}> = {
    definition: {
        id: "firebot:update-dynamic-countdown",
        name: "Update Countdown (Dynamic)",
        description: "Update a dynamic countdown timer's remaining time.",
        icon: "fad fa-hourglass-half",
        categories: ["overlay", "advanced"],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container ng-hide="hasCountdownWidgets">
            <p>You need to create a Countdown (Dynamic) Overlay Widget to use this effect! Go to the <b>Overlay Widgets</b> tab to create one.</p>
        </eos-container>
        <div ng-show="hasCountdownWidgets">
            <eos-container header="Countdown">
                <firebot-overlay-widget-select
                    overlay-widget-types="['firebot:countdown-dynamic']"
                    ng-model="effect.countdownWidgetId"
                />
            </eos-container>

            <div ng-show="effect.countdownWidgetId">

                <eos-container header="Action" pad-top="true">
                    <firebot-radio-cards
                        options="actions"
                        ng-model="effect.action"
                        grid-columns="2"
                    ></firebot-radio-cards>
                </eos-container>

                <eos-container header="Mode" pad-top="true" ng-if="effect.action == 'change-mode'">
                    <firebot-radio-cards
                        options="modes"
                        ng-model="effect.mode"
                        grid-columns="3"
                    ></firebot-radio-cards>
                </eos-container>

                <eos-container header="{{effect.action === 'set' ? 'New Value' : 'Value'}}" pad-top="true" ng-show="effect.action && effect.action !== 'change-mode'">
                    <firebot-input
                        model="effect.value"
                        input-title="Secs"
                        data-type="number"
                        placeholder-text="Enter number of seconds"
                    />

                    <firebot-checkbox
                        style="margin-top: 10px"
                        model="effect.startIfPaused"
                        label="Start Countdown If Paused"
                        tooltip="Whether or not you want the countdown to start if it is currently paused."
                    />
                </eos-container>
            </div>
        </div>
    `,
    optionsController: ($scope, overlayWidgetsService) => {
        $scope.hasCountdownWidgets = overlayWidgetsService.hasOverlayWidgetConfigsOfType("firebot:countdown-dynamic");

        $scope.actions = [
            {
                value: "add",
                label: "Add Time",
                iconClass: "fa-plus"
            },
            {
                value: "subtract",
                label: "Subtract Time",
                iconClass: "fa-minus"
            },
            {
                value: "set",
                label: "Set Time",
                iconClass: "fa-equals"
            },
            {
                value: "change-mode",
                label: "Change Mode",
                iconClass: "fa-exchange"
            }
        ];

        $scope.modes = [
            {
                value: "toggle",
                label: "Toggle",
                iconClass: "fa-exchange"
            },
            {
                value: "running",
                label: "Start/Resume",
                iconClass: "fa-play"
            },
            {
                value: "paused",
                label: "Pause",
                iconClass: "fa-pause"
            }
        ];
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (effect.countdownWidgetId == null) {
            errors.push("Please select a countdown widget.");
        } else if (effect.action == null) {
            errors.push("Please select an action to take.");
        } else if (effect.action === "change-mode" && effect.mode == null) {
            errors.push("Please select a mode to change to.");
        } else if (effect.action !== "change-mode" && effect.value == null) {
            errors.push("Please enter a value.");
        }

        return errors;
    },
    getDefaultLabel: (effect, overlayWidgetsService) => {
        const countdownName = overlayWidgetsService.getOverlayWidgetConfig(effect.countdownWidgetId)?.name ?? "Unknown Countdown";
        return `${effect.action === "add" ? "Update" : "Set"} ${countdownName} ${effect.action === "add" ? "by" : "to"} ${effect.value}`;
    },
    onTriggerEvent: (event) => {
        const { effect } = event;

        if (effect.countdownWidgetId == null || effect.action == null) {
            return false;
        }

        const countdownWidget = overlayWidgetConfigManager.getItem(effect.countdownWidgetId) as DynamicCountdownWidgetConfig | null;
        if (!countdownWidget) {
            logger.warn(`Failed to update Countdown ${effect.countdownWidgetId} because it does not exist.`);
            return false;
        }

        if (effect.action === "change-mode") {
            if (effect.mode == null) {
                logger.warn(`Failed to change Countdown ${effect.countdownWidgetId} mode because no mode was specified.`);
                return false;
            }

            let newMode: "running" | "paused";
            if (effect.mode === "toggle") {
                newMode = countdownWidget.state?.mode === "running" ? "paused" : "running";
            } else {
                newMode = effect.mode === "running" ? "running" : "paused";
            }

            const newState: DynamicCountdownWidgetConfig["state"] = {
                ...countdownWidget.state,
                mode: newMode
            };

            overlayWidgetConfigManager.setWidgetStateById(effect.countdownWidgetId, newState);
        } else {
            if (effect.value == null) {
                logger.warn(`Failed to update Countdown ${effect.countdownWidgetId} because no value was specified.`);
                return false;
            }

            const value = parseInt(effect.value);

            if (isNaN(value)) {
                logger.warn(`Failed to update Countdown ${effect.countdownWidgetId} because ${effect.value} is not a number.`);
                return false;
            }

            countdownManager.updateCountdownTime(effect.countdownWidgetId, effect.action, value, false, effect.startIfPaused);
        }

        return true;
    }
};

export = model;