import { TypedEmitter } from "tiny-typed-emitter";
import { PlatformApi } from "./api";

interface PlatformEvents {
    connected: VoidFunction;
    disconnected: VoidFunction;
}

export class PlatformEventEmitter extends TypedEmitter<PlatformEvents> {}

declare interface StreamingPlatform extends PlatformEventEmitter {
    id: string;
    name: string;
    init: VoidFunction;
    connect: VoidFunction;
    disconnect: VoidFunction;
    api: PlatformApi;
}
