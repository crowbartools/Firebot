import { EffectType } from "../../../../types/effects";
import overlayWidgetConfigManager from "../../../overlay-widgets/overlay-widget-config-manager";
import logger from "../../../logwrapper";

const model: EffectType<{
    customWidgetId: string;
    newStateJson?: string;
    mergeWithExistingState?: boolean;
}> = {
    definition: {
        id: "firebot:set-custom-widget-state",
        name: "Set Custom Widget State",
        description: "Set the state of a Custom or Custom (Advanced) Overlay Widget.",
        icon: "fad fa-cog",
        categories: ["overlay", "advanced"],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container ng-hide="hasCustomWidgets">
            <p>You need to create a Custom or Custom (Advanced) Overlay Widget to use this effect! Go to the <b>Overlay Widgets</b> tab to create one.</p>
        </eos-container>
        <div ng-show="hasCustomWidgets">
            <eos-container header="Custom Widget">
                <firebot-overlay-widget-select
                    overlay-widget-types="['firebot:custom', 'firebot:custom-advanced']"
                    ng-model="effect.customWidgetId"
                />
            </eos-container>

            <div ng-show="effect.customWidgetId">

                <eos-container header="New State JSON" pad-top="true">
                    <firebot-input
                        model="effect.newStateJson"
                        input-type="codemirror"
                        code-mirror-options="codeMirrorOptions"
                        menu-position="under"
                    />
                </eos-container>

                <eos-container header="Options" pad-top="true">
                    <firebot-checkbox
                        label="Merge with existing state (if any)"
                        tooltip="If checked, the new state will be merged with the existing state instead of replacing it."
                        model="effect.mergeWithExistingState"
                    />
                </eos-container>

            </div>
        </div>
    `,
    optionsController: ($scope, overlayWidgetsService) => {
        $scope.hasCustomWidgets = overlayWidgetsService.hasOverlayWidgetConfigsOfTypes([
            "firebot:custom",
            "firebot:custom-advanced"
        ]);

        $scope.codeMirrorOptions = {
            mode: { name: "javascript", json: true },
            lineNumbers: true,
            showGutter: true,
            autoRefresh: true,
            theme: "blackboard"
        };
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (effect.customWidgetId == null) {
            errors.push("Please select a custom widget.");
        }

        return errors;
    },
    onTriggerEvent: async (event) => {
        const { effect } = event;

        if (effect.customWidgetId == null) {
            return false;
        }

        const customWidget = overlayWidgetConfigManager.getItem(effect.customWidgetId);
        if (!customWidget) {
            logger.warn(`Failed to update Custom Widget ${effect.customWidgetId} because it does not exist.`);
            return false;
        }

        if (customWidget.type !== "firebot:custom" && customWidget.type !== "firebot:custom-advanced") {
            logger.warn(`Failed to update Custom Widget ${effect.customWidgetId} because it is not a Custom or Custom (Advanced) widget.`);
            return false;
        }

        let newState = {};
        if (effect.newStateJson) {
            try {
                newState = JSON.parse(effect.newStateJson);
            } catch (e) {
                logger.warn(`Failed to update Custom Widget ${effect.customWidgetId} because the provided state is not valid JSON.`);
                return false;
            }
        }

        const existingStateIsObject = typeof customWidget.state === "object" && customWidget.state !== null && !Array.isArray(customWidget.state);
        const newStateIsObject = typeof newState === "object" && newState !== null && !Array.isArray(newState);

        if (effect.mergeWithExistingState) {
            if (existingStateIsObject && newStateIsObject) {
                newState = {
                    ...customWidget.state,
                    ...newState
                };
            } else if (Array.isArray(customWidget.state) && Array.isArray(newState)) {
                newState = [
                    ...customWidget.state,
                    ...newState
                ];
            }
        }

        overlayWidgetConfigManager.setWidgetStateById(effect.customWidgetId, newState);

        return true;
    }
};

export = model;