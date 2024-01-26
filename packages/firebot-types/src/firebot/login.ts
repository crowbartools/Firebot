export interface Account {
    userId: string;
    username: string;
    avatarUrl: string;
    tokenData: unknown;
}

export interface LoginConfig {
  id: string;
  streamer?: Account;
  bot?: Account;
}

export interface StreamingPlatformLoginSettings {
  [platformId: string]: {
    activeLoginConfigId: string;
    loginConfigs: LoginConfig[];
  };
}