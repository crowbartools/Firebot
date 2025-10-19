import eventManager from "./EventManager";

import { FirebotEventSource } from "./builtin/firebot-event-source";
import { TwitchEventSource } from "../streaming-platforms/twitch/events";

export function loadEventSources() {
    eventManager.registerEventSource(FirebotEventSource);
    eventManager.registerEventSource(TwitchEventSource);
};