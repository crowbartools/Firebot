import { EffectType } from "../../../types/effects";
import { EffectCategory } from "../../../shared/effect-constants";
import logger from "../../logwrapper";
import HttpServerManager from "../../../server/http-server-manager";

const model: EffectType<{
    eventName: string;
    eventData: string;
}> = {
    definition: {
        id: "firebot:send-custom-websocket-event",
        name: "Send Custom WebSocket Event",
        description: "Sends a custom event and any relevant data to all connected WebSocket clients",
        icon: "fad fa-plug",
        categories: [EffectCategory.ADVANCED, EffectCategory.SCRIPTING],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container header="Event Name">
            <p class="muted">Enter the name of the event you'd like to send.</p>
            <firebot-input
                model="effect.eventName"
                placeholder-text="Enter event name"
                menu-position="under"
            />
            <p class="help-block">It will be sent as: <code>custom-event:{{effect.eventName || 'eventname'}}</code></p>
        </eos-container>

        <eos-container header="Event Data" pad-top="true">
            <p class="muted">Enter any event data that you'd like to include with the event.</p>
            <selectable-input-editors
                editors="editors"
                initial-editor-label="initialEditorLabel"
                model="effect.eventData"
            />
        </eos-container>
    `,
    optionsController: ($scope) => {
        $scope.editors = [
            {
                label: "Basic",
                inputType: "text",
                useTextArea: true,
                placeholderText: "Enter event data",
                menuPosition: "under"
            },
            {
                label: "JSON",
                inputType: "codemirror",
                menuPosition: "under",
                codeMirrorOptions: {
                    mode: {name: "javascript", json: true},
                    theme: 'blackboard',
                    lineNumbers: true,
                    autoRefresh: true,
                    showGutter: true
                }
            }
        ];

        $scope.initialEditorLabel = $scope.effect?.eventData?.startsWith("{") || $scope.effect?.eventData?.startsWith("[") ? "JSON" : "Basic";
    },
    optionsValidator: (effect) => {
        const errors = [];
        if (!(effect.eventName?.length > 0)) {
            errors.push("Please input an event name.");
        }
        return errors;
    },
    onTriggerEvent: async ({ effect }) => {
        try {
            let data: unknown = effect.eventData ?? {};

            try {
                data = JSON.parse(effect.eventData);
            } catch { }
            HttpServerManager.triggerCustomWebSocketEvent(effect.eventName, data as object);
        } catch (error) {
            logger.error(`Error sending custom WebSocket event ${effect.eventName}`, error);
        }
    }
};

module.exports = model;