import { Account, AuthProviderConfig, StreamingPlatform } from "firebot-types";
import { Inject, Injectable } from '@nestjs/common';

import Twitch from "./platforms/twitch/twitch";
import { AuthProviderManager } from "../auth/auth-provider-manager.service";
import { StreamingPlatformConfig } from "../config/streaming-platform.config";
import { ConfigType } from "@nestjs/config";
import { ConnectableRegistryService } from "connection/connectable-registry.service";
import { StreamingPlatformLoginsStore } from "../data-access/stores/streaming-platform-logins.store";
import { PlatformEventListenerService } from "./platform-event-listener.service";

@Injectable()
export class PlatformManagerService {
  constructor(
    private readonly authProviderManager: AuthProviderManager,
    private readonly connectableRegistryService: ConnectableRegistryService,
    private readonly loginsStore: StreamingPlatformLoginsStore,
    private readonly platformEventListenerService: PlatformEventListenerService,
    @Inject(StreamingPlatformConfig.KEY)
    private streamingPlatformConfig: ConfigType<typeof StreamingPlatformConfig>
  ) {
    this.registerStreamingPlatform(new Twitch(this.streamingPlatformConfig));
  }

  private platforms: StreamingPlatform[] = [];

  registerStreamingPlatform(platform: StreamingPlatform): void {
    if (this.platforms.some((p) => p.id === platform.id)) {
      throw new Error(`Platform ${platform.id} is already registered.`);
    }
    this.platforms.push(platform);

    const { streamerScopes, botScopes, ...authConfig } = platform.auth;

    const streamerAuth: AuthProviderConfig = {
      id: `${platform.id}-streamer`,
      name: `${platform.name} Streamer Account`,
      ...authConfig,
      scopes: streamerScopes,
    };

    const botAuth: AuthProviderConfig = {
      id: `${platform.id}-bot`,
      name: `${platform.name} Bot Account`,
      ...authConfig,
      scopes: botScopes,
    };

    try {
      this.authProviderManager.registerProvider(streamerAuth);
      this.authProviderManager.registerProvider(botAuth);
    } catch (e) {
      console.log("Failed to register auth provider", e);
    }

    const activeLogin = this.getActiveLoginConfigForPlatform(platform.id);
    platform.init(activeLogin?.streamer, activeLogin?.bot);

    this.connectableRegistryService.registerConnectable(
      platform,
      "streaming-platform"
    );

    this.platformEventListenerService.addPlatformListeners(platform);
  }

  getPlatform(id: string): StreamingPlatform | void {
    return this.platforms.find((p) => p.id === id);
  }

  getPlatforms(): StreamingPlatform[] {
    return this.platforms;
  }

  triggerLoginUpdate(
    platformId: string,
    streamerAccount?: Account,
    botAccount?: Account
  ) {
    const platform = this.getPlatform(platformId);
    if (!platform) {
      return;
    }

    platform.onLoginUpdate(streamerAccount, botAccount);
  }

  private getActiveLoginConfigForPlatform(platformId: string) {
    const platformLogins = this.loginsStore.get(platformId);
    if (!platformLogins) {
      return null;
    }
    return platformLogins.loginConfigs.find(
      (lc) => lc.id === platformLogins.activeLoginConfigId
    );
  }
}
