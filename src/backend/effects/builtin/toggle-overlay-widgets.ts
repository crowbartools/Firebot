import { EffectType } from "../../../types/effects";
import { OverlayWidgetConfig } from "../../../types/overlay-widgets";
import overlayWidgetConfigManager from "../../overlay-widgets/overlay-widget-config-manager";

const effect: EffectType<{
    mode: "toggle" | "disable" | "enable";
    widgetConfigIds: string[];
}> = {
    definition: {
        id: "firebot:toggle-overlay-widgets",
        name: "Toggle Overlay Widgets",
        description: "Toggle the active status of overlay widgets.",
        icon: "fad fa-toggle-off",
        categories: ["overlay", "advanced", "firebot control"],
        dependencies: []
    },
    optionsTemplate: `
        <div ng-hide="hasWidgets">
            <p>You need to create an Overlay Widget to use this effect! Go to the <b>Overlay Widgets</b> tab to create one.</p>
        </div>
        <div ng-show="hasWidgets">

            <eos-container header="Mode">
                <firebot-radio-cards
                    options="modes"
                    ng-model="effect.mode"
                    grid-columns="3"
                ></firebot-radio-cards>
            </eos-container>

            <eos-container header="Overlay Widgets" pad-top="true" ng-if="effect.mode != null">
                <multiselect-list
                    model="effect.widgetConfigIds"
                    options="widgetOptions"
                    settings="{ options: widgetOptions }"
                />
            </eos-container>
        </div>
    `,
    optionsController: ($scope, overlayWidgetsService) => {
        $scope.hasWidgets = overlayWidgetsService.overlayWidgetConfigs.length > 0;

        $scope.widgetOptions = overlayWidgetsService.overlayWidgetConfigs.map((w: OverlayWidgetConfig) => {
            const type = overlayWidgetsService.getOverlayWidgetType(w.type);
            return {
                id: w.id,
                name: w.name,
                description: type ? type.name : "Unknown Type",
                iconClass: type ? type.icon : "fa-question"
            };
        });

        $scope.modes = [
            {
                value: "toggle",
                label: "Toggle",
                iconClass: "fa-exchange"
            },
            {
                value: "enable",
                label: "Enable",
                iconClass: "fa-toggle-on"
            },
            {
                value: "disable",
                label: "Disable",
                iconClass: "fa-toggle-off"
            }
        ];

        if ($scope.effect.widgetConfigIds == null) {
            $scope.effect.widgetConfigIds = [];
        }
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];

        if (effect.mode == null) {
            errors.push("Please select a mode.");
        }

        if (!effect.widgetConfigIds?.length) {
            errors.push("Please select at least one overlay widget.");
        }

        return errors;
    },
    getDefaultLabel: (effect, utilityService) => {
        return `${utilityService.capitalize(effect.mode)} ${effect.widgetConfigIds?.length ?? 0} overlay widget(s)`;
    },
    onTriggerEvent: (event) => {
        const { effect } = event;

        if (effect.mode == null) {
            return false;
        }

        const widgetConfigs = effect.widgetConfigIds
            ?.map((id: string) => overlayWidgetConfigManager.getItem(id))
            .filter((w): w is OverlayWidgetConfig => w != null) ?? [];

        if (widgetConfigs.length === 0) {
            return false;
        }

        for (const widgetConfig of widgetConfigs) {
            let newStatus: boolean;
            if (effect.mode === "toggle") {
                newStatus = !widgetConfig.active;
            } else if (effect.mode === "enable") {
                newStatus = true;
            } else { // disable
                newStatus = false;
            }
            if (widgetConfig.active !== newStatus) {
                const updatedConfig: OverlayWidgetConfig = {
                    ...widgetConfig,
                    active: newStatus
                };
                overlayWidgetConfigManager.saveWidgetConfig(updatedConfig);
                overlayWidgetConfigManager.triggerUiRefresh();
            }
        }

        return true;
    }
};

export = effect;