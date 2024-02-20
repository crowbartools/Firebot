import { Injectable } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import { StreamingPlatformLoginsStore } from "./stores/streaming-platform-logins.store";
import { AuthMetadata, AuthProviderManager } from "auth/auth-provider-manager.service";
import { PlatformManagerService } from "streaming-platform/platform-manager.service";
import type {
  Account,
  AuthTokenSet,
  FirebotAccountType,
  LoginConfig,
} from "firebot-types";
import { RealTimeGateway } from "real-time/real-time.gateway";

@Injectable()
export class LoginService {
  constructor(
    private readonly loginsStore: StreamingPlatformLoginsStore,
    private readonly authProviderManager: AuthProviderManager,
    private readonly streamingPlatformManager: PlatformManagerService,
    private readonly realTimeGateway: RealTimeGateway
  ) {
    authProviderManager.on(
      "successful-auth",
      (_provider, tokenSet, metadata) => {
        this.handleSuccessfulAuth(tokenSet, metadata);
      }
    );
  }

  getAllPlatformLogins() {
    return this.loginsStore.getRoot();
  }

  createLoginForPlatform(platformId: string) {
    const allLogins = this.loginsStore.getRoot();
    let platformLogins = allLogins[platformId];
    if (!platformLogins) {
      platformLogins = {
        activeLoginConfigId: "",
        loginConfigs: [],
      };
    }
    const loginConfigId = uuid();
    platformLogins.activeLoginConfigId = loginConfigId;
    const loginConfig = {
      id: loginConfigId,
      streamer: undefined,
      bot: undefined,
    };
    platformLogins.loginConfigs.push(loginConfig);
    this.loginsStore.set(platformId, platformLogins);
    return loginConfig;
  }

  setActiveLoginConfig(platformId: string, loginConfigId: string): boolean {
    const platformLogins = this.loginsStore.get(platformId);
    const loginConfig = platformLogins?.loginConfigs?.find(
      (lc) => lc.id === loginConfigId
    );

    if (!loginConfig) {
      return false;
    }

    platformLogins.activeLoginConfigId = loginConfigId;

    this.loginsStore.set(platformId, platformLogins);

    this.streamingPlatformManager.triggerLoginUpdate(
      platformId,
      loginConfig.streamer,
      loginConfig.bot
    );

    return true;
  }

  deleteLoginForPlatform(platformId: string, loginConfigId: string): boolean {
    const platformLogins = this.loginsStore.get(platformId);
    if (
      !platformLogins ||
      !platformLogins.loginConfigs.some((lc) => lc.id === loginConfigId)
    ) {
      return false;
    }
    platformLogins.loginConfigs = platformLogins.loginConfigs.filter(
      (lc) => lc.id !== loginConfigId
    );
    if (platformLogins.activeLoginConfigId === loginConfigId) {
      platformLogins.activeLoginConfigId = platformLogins.loginConfigs[0]?.id;
    }
    this.loginsStore.set(platformId, platformLogins);
    return true;
  }

  updateLoginForPlatform(platformId: string, loginConfig: LoginConfig) {
    const platformLogins = this.loginsStore.get(platformId);
    if (!platformLogins) {
      return;
    }
    const index = platformLogins.loginConfigs.findIndex(
      (lc) => lc.id === loginConfig.id
    );
    if (index === -1) {
      return;
    }
    platformLogins.loginConfigs[index] = loginConfig;
    this.loginsStore.set(platformId, platformLogins);

    if (platformLogins.activeLoginConfigId === loginConfig.id) {
      this.streamingPlatformManager.triggerLoginUpdate(
        platformId,
        loginConfig.streamer,
        loginConfig.bot
      );
    }
    return true;
  }

  deleteAccountForLoginForPlatform(
    platformId: string,
    loginConfigId: string,
    accountType: FirebotAccountType
  ) {
    const platformLogins = this.loginsStore.get(platformId);
    if (!platformLogins) {
      return false;
    }
    const loginConfig = platformLogins.loginConfigs.find(
      (lc) => lc.id === loginConfigId
    );
    if (!loginConfig) {
      return false;
    }
    loginConfig[accountType] = undefined;
    this.updateLoginForPlatform(platformId, loginConfig);
    return true;
  }

  private async handleSuccessfulAuth(
    tokenSet: AuthTokenSet,
    metadata: AuthMetadata
  ) {
    if (!tokenSet || !tokenSet.accessToken) {
      return;
    }

    const loginsForPlatform = this.loginsStore.get(
      metadata.streamingPlatformId
    );
    if (!loginsForPlatform) {
      return;
    }

    const loginConfig = loginsForPlatform.loginConfigs.find(
      (lc) => lc.id === metadata.loginConfigId
    );
    if (!loginConfig) {
      return;
    }

    const platform = this.streamingPlatformManager.getPlatform(
      metadata.streamingPlatformId
    );
    if (!platform) {
      return;
    }

    const user = await platform.api.getUserByAccessToken(tokenSet.accessToken);
    if (!user) {
      return;
    }

    const accountData: Account = {
      userId: user.id,
      avatarUrl: user.avatarUrl,
      username: user.username,
      displayName: user.displayName,
      tokenData: tokenSet,
    };

    if (metadata.accountType === "streamer") {
      loginConfig.streamer = accountData;
    } else {
      loginConfig.bot = accountData;
    }

    this.updateLoginForPlatform(metadata.streamingPlatformId, loginConfig);

    this.realTimeGateway.broadcast("login-update", {
      platformId: metadata.streamingPlatformId,
      loginConfigId: loginConfig.id,
      loginConfig,
    });

    this.loginsStore.set(metadata.streamingPlatformId, loginsForPlatform);
  }
}