import { Injectable } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import { StreamingPlatformLoginsStore } from "./stores/streaming-platform-logins.store";
import { AuthMetadata, AuthProviderManager } from "auth/auth-provider-manager.service";
import { PlatformManagerService } from "streaming-platform/platform-manager.service";
import type { Account } from "firebot-types";
import type { TokenSet } from "openid-client";

@Injectable()
export class LoginService {
  constructor(
    private readonly loginsStore: StreamingPlatformLoginsStore,
    private readonly authProviderManager: AuthProviderManager,
    private readonly streamingPlatformManager: PlatformManagerService,
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
    if (
      !platformLogins ||
      !platformLogins.loginConfigs.some((lc) => lc.id === loginConfigId)
    ) {
      return false;
    }
    platformLogins.activeLoginConfigId = loginConfigId;
    this.loginsStore.set(platformId, platformLogins);
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

  private async handleSuccessfulAuth(
    tokenSet: TokenSet,
    metadata: AuthMetadata
  ) {
    if (!tokenSet || !tokenSet.access_token) {
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

    const user = await platform.api.getUserByAccessToken(tokenSet.access_token);
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
  }
}