import { TriggerEventBridge } from "./trigger-event-bridge.types";
import { ChatItem, StreamingPlatform } from "firebot-types";

type PlatformChatItemPayload = {
    platform: StreamingPlatform;
    data: ChatItem;
};

type PlatformConnectionPayload = {
    platform: StreamingPlatform;
};

const twitchChatMessageBridge: TriggerEventBridge = {
    id: "twitch-chat-message",
    emitterEvent: "platform.chatItem",
    sourceId: "twitch",
    eventId: "chat-message",
    shouldHandle: (payload) => {
        const chatPayload = payload as PlatformChatItemPayload;
        return chatPayload?.platform?.id === "twitch" && chatPayload?.data?.type === "message";
    },
    toMetadata: (payload) => {
        const chatPayload = payload as PlatformChatItemPayload;
        return chatPayload.data.type === "message"
            ? {
                platformId: chatPayload.platform.id,
                chatMessage: chatPayload.data.chatMessage,
            }
            : {
                platformId: chatPayload.platform.id,
            };
    },
};

const twitchConnectedBridge: TriggerEventBridge = {
    id: "twitch-connected",
    emitterEvent: "platform.connected",
    sourceId: "firebot",
    eventId: "chat-connected",
    shouldHandle: (payload) => {
        const connectionPayload = payload as PlatformConnectionPayload;
        return connectionPayload?.platform?.id === "twitch";
    },
    toMetadata: (payload) => {
        const connectionPayload = payload as PlatformConnectionPayload;
        return {
            platformId: connectionPayload.platform.id,
        };
    },
};

export const TRIGGER_EVENT_BRIDGES: TriggerEventBridge[] = [
    twitchChatMessageBridge,
    twitchConnectedBridge,
];

export const TRIGGER_EVENT_BRIDGES_BY_EMITTER = TRIGGER_EVENT_BRIDGES.reduce(
    (grouped, bridge) => {
        const existing = grouped.get(bridge.emitterEvent) ?? [];
        existing.push(bridge);
        grouped.set(bridge.emitterEvent, existing);
        return grouped;
    },
    new Map<string, TriggerEventBridge[]>()
);
