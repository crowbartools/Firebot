import type { EffectType } from "../../../../types";

import overlayWidgetConfigManager from "../../../overlay-widgets/overlay-widget-config-manager";

const model: EffectType<{
    chatWidgetId: string;
}> = {
    definition: {
        id: "firebot:clear-chat-widget",
        name: "Clear Chat Widget",
        description: "Clears all messages from a chat widget.",
        icon: "fad fa-eraser",
        categories: ["overlay", "advanced"],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container ng-hide="hasChatWidgets">
            <p>You need to create a Chat or Chat (Advanced) Overlay Widget to use this effect! Go to the <b>Overlay Widgets</b> tab to create one.</p>
        </eos-container>

        <eos-container header="Chat Widget" ng-show="hasChatWidgets">
            <firebot-overlay-widget-select
                overlay-widget-types="['firebot:chat','firebot:chat-advanced']"
                ng-model="effect.chatWidgetId"
            />
        </eos-container>
    `,
    optionsController: ($scope, overlayWidgetsService) => {
        $scope.hasChatWidgets = overlayWidgetsService.hasOverlayWidgetConfigsOfType("firebot:chat")
            || overlayWidgetsService.hasOverlayWidgetConfigsOfType("firebot:chat-advanced");
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (effect.chatWidgetId == null) {
            errors.push("Please select a chat widget.");
        }

        return errors;
    },
    getDefaultLabel: (effect, overlayWidgetsService) => {
        const chatWidgetName = overlayWidgetsService.getOverlayWidgetConfig(effect.chatWidgetId)?.name as string ?? "Unknown Chat Widget";
        return chatWidgetName;
    },
    onTriggerEvent: ({ effect }) => {
        if (effect.chatWidgetId == null) {
            return false;
        }

        overlayWidgetConfigManager.setWidgetStateById(effect.chatWidgetId, {
            chatMessages: null
        });

        return true;
    }
};

export = model;