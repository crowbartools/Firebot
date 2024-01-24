import { TypedEmitter } from "tiny-typed-emitter";
import { PlatformApi } from "./api";
import { ChatProvider } from "./chat";
import { StreamingPlatformAuthConfig } from "./auth";

interface PlatformEvents {
    connected: VoidFunction;
    disconnected: VoidFunction;
}

export class PlatformEventEmitter extends TypedEmitter<PlatformEvents> {}

export interface StreamingPlatform extends PlatformEventEmitter {
  id: string;
  name: string;
  color?: {
    bg: string;
    text: string;
  };
  auth: StreamingPlatformAuthConfig;
  init: VoidFunction;
  connect: VoidFunction;
  disconnect: VoidFunction;
  api: PlatformApi;
  chat: ChatProvider;
}
