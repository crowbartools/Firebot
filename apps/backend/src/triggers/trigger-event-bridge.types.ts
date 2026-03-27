export type TriggerEventBridge = {
    id: string;
    emitterEvent: string;
    sourceId: string;
    eventId: string;
    shouldHandle?: (payload: unknown) => boolean;
};
