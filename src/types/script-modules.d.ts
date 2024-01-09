export interface FrontendCommunicatorModule {
    send(eventName: string, data: unknown): void;
    on<ExpectedArgs extends Array<unknown> = [], ReturnPayload = void>(
        eventName: string,
        callback: (...args: ExpectedArgs) => ReturnPayload
    ): void;
    onAsync<ExpectedArgs extends Array<unknown> = [], ReturnPayload = void>(
        eventName: string,
        callback: (...args: ExpectedArgs) => Promise<ReturnPayload>
    ): void;
    fireEventAsync<ReturnPayload = void>(
        eventName: string,
        data: unknown
    ): Promise<ReturnPayload>;
}