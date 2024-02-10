import { TypedEmitter } from "tiny-typed-emitter";
import { PlatformApi } from "./api";
import { ChatProvider } from "./chat";
import { StreamingPlatformAuthConfig } from "./auth";
import { Account } from "../firebot";

interface PlatformEvents {
    connected: VoidFunction;
    disconnected: VoidFunction;
}

export class PlatformEventEmitter extends TypedEmitter<PlatformEvents> {}

export interface StreamingPlatform extends PlatformEventEmitter {
  id: string;
  name: string;
  icon?: string;
  auth: StreamingPlatformAuthConfig;
  init: (streamerAccount?: Account, botAccount?: Account) => void;
  connect: VoidFunction;
  disconnect: VoidFunction;
  onLoginUpdate: (streamerAccount?: Account, botAccount?: Account) => void;
  api: PlatformApi;
  chat: ChatProvider;
}
