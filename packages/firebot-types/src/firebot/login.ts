import type { Id } from "../streaming-platform/helpers";

export interface Account {
  userId: Id;
  username: string;
  displayName: string;
  avatarUrl?: string;
  tokenData: unknown;
}

export type FirebotAccountType = "streamer" | "bot";

export interface LoginConfig {
  id: string;
  streamer?: Account;
  bot?: Account;
}

export interface PlatformLoginSetting {
  activeLoginConfigId: string;
  loginConfigs: LoginConfig[];
}

export interface StreamingPlatformLoginSettings {
  [platformId: string]: PlatformLoginSetting;
}