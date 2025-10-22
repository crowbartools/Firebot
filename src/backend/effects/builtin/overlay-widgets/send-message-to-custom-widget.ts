import { EffectType } from "../../../../types/effects";
import overlayWidgetConfigManager from "../../../overlay-widgets/overlay-widget-config-manager";
import overlayWidgetsManager from "../../../overlay-widgets/overlay-widgets-manager";
import logger from "../../../logwrapper";

const model: EffectType<{
    customWidgetId: string;
    messageName: string;
    messageDataJson?: string;
}> = {
    definition: {
        id: "firebot:send-message-to-custom-widget",
        name: "Send Message to Custom Widget",
        description: "Send a message to a Custom or Custom (Advanced) Overlay Widget.",
        icon: "fad fa-paper-plane",
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
                <eos-container header="Message" pad-top="true">
                    <firebot-input
                        input-title="Name"
                        model="effect.messageName"
                        placeholder-text="Enter message name"
                        menu-position="under"
                    />

                    <div class="form-group mt-4">
                        <label>Data (JSON)</label>
                        <firebot-input
                            model="effect.messageDataJson"
                            input-type="codemirror"
                            code-mirror-options="codeMirrorOptions"
                            menu-position="under"
                        />
                        <span class="help-block">Optional data to send with the message. Must be valid JSON.</span>
                    </div>
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
        } else if (effect.messageName == null || effect.messageName.trim() === "") {
            errors.push("Please enter a message name.");
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

        if (customWidget.active === false) {
            logger.warn(`Skipped sending message to Custom Widget ${effect.customWidgetId} because it is not currently active in the overlay.`);
            return false;
        }

        let messageData = {};
        if (effect.messageDataJson) {
            try {
                messageData = JSON.parse(effect.messageDataJson);
            } catch (e) {
                logger.warn(`Failed to parse message data for Custom Widget ${effect.customWidgetId} because the provided message data is not valid JSON.`);
                return false;
            }
        }

        overlayWidgetsManager.sendWidgetEventToOverlay("message", customWidget, {
            messageName: effect.messageName,
            messageData
        });

        return true;
    }
};

export = model;