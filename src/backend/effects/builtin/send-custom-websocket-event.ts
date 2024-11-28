import { EffectType } from "../../../types/effects";
import { EffectCategory } from "../../../shared/effect-constants";
import logger from "../../logwrapper";
import WebSocketServerManager from "../../../server/websocket-server-manager";

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
            <p class="muted">Enter the name of the event you'd like to send. It will be sent as:<br/><code>custom-event:eventname</code></p>
            <firebot-input
                model="effect.eventName"
                placeholder-text="Enter event name"
                menu-position="under"
            />
        </eos-container>

        <eos-container header="Event Data" pad-top="true">
            <p class="muted">Enter any event data that you'd like to include with the event.</p>
            <firebot-input
                model="effect.eventData"
                placeholder-text="Enter event data"
                use-text-area="true"
                rows="4"
                cols="40"
                menu-position="under"
            />
        </eos-container>
    `,
    optionsController: () => { },
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
            WebSocketServerManager.triggerEvent(`custom-event:${effect.eventName}`, data as object);
        } catch (error) {
            logger.error(`Error sending custom WebSocket event ${effect.eventName}`, error);
        }
    }
};

module.exports = model;