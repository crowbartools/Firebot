export type TriggerEventBridge<TPayload = unknown> = {
    id: string;
    emitterEvent: string;
    sourceId: string;
    eventId: string;
    shouldHandle?: (payload: TPayload) => boolean;
    toMetadata?: (payload: TPayload) => Record<string, unknown> | undefined;
};

export function defineTriggerEventBridge<TPayload = unknown>(
    bridge: TriggerEventBridge<TPayload>
): TriggerEventBridge<TPayload> {
    return bridge;
}
