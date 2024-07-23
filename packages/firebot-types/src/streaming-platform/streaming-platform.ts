import { PlatformApi } from "./api";
import { ChatProvider } from "./chat";
import { StreamingPlatformAuthConfig } from "./auth";
import { Account, Connectable } from "../firebot";


export interface StreamingPlatform extends Connectable {
  id: string;
  name: string;
  icon?: string;
  auth: StreamingPlatformAuthConfig;
  init: (streamerAccount?: Account, botAccount?: Account) => void;
  onLoginUpdate: (streamerAccount?: Account, botAccount?: Account) => void;
  api: PlatformApi;
  chat: ChatProvider;
}
