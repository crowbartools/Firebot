import { PlatformApi } from "./api";

export interface StreamingPlatform extends NodeJS.EventEmitter {
    id: string;
    name: string;
    init: VoidFunction;
    connect: VoidFunction;
    disconnect: VoidFunction;
    api: PlatformApi;
}
