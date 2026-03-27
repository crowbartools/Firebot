import { TriggerEventBridge } from "./trigger-event-bridge.types";

const twitchChatMessageBridge: TriggerEventBridge = {
    id: "twitch-chat-message",
    emitterEvent: "platform.chatItem",
    sourceId: "twitch",
    eventId: "chat-message",
    shouldHandle: (payload) => {
        const chatPayload = payload as {
            platform?: { id?: string };
            data?: { type?: string };
        };
        return chatPayload?.platform?.id === "twitch" && chatPayload?.data?.type === "message";
    },
};

const twitchConnectedBridge: TriggerEventBridge = {
    id: "twitch-connected",
    emitterEvent: "platform.connected",
    sourceId: "firebot",
    eventId: "chat-connected",
    shouldHandle: (payload) => {
        const connectionPayload = payload as { platform?: { id?: string } };
        return connectionPayload?.platform?.id === "twitch";
    },
};

const triggerEventBridges: TriggerEventBridge[] = [
    twitchChatMessageBridge,
    twitchConnectedBridge,
];

export const TRIGGER_EVENT_BRIDGES_BY_EMITTER = triggerEventBridges.reduce(
    (grouped, bridge) => {
        const existing = grouped.get(bridge.emitterEvent) ?? [];
        existing.push(bridge);
        grouped.set(bridge.emitterEvent, existing);
        return grouped;
    },
    new Map<string, TriggerEventBridge[]>()
);
