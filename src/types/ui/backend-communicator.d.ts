export type BackendCommunicator = {
    on: (eventName: string, callback: (data: unknown) => void, async?: boolean) => string;
    onAsync: (eventName: string, callback: (data: unknown) => Promise<unknown>) => string;
    fireEventAsync: <T = unknown>(type: string, data?: unknown) => Promise<T>;
    fireEventSync: <T = unknown>(type: string, data?: unknown) => T;
    fireEvent: (type: string, data?: unknown) => void;
    send: (type: string, data?: unknown) => void;
};
