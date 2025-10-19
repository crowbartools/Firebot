import { EventManager } from "./event-manager";

import { FirebotEventSource } from "./builtin/firebot-event-source";
import { TwitchEventSource } from "../streaming-platforms/twitch/events";

export function loadEventSources() {
    EventManager.registerEventSource(FirebotEventSource);
    EventManager.registerEventSource(TwitchEventSource);
};