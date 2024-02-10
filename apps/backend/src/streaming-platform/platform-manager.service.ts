import { Account, AuthProviderConfig, StreamingPlatform } from "firebot-types";
import { Inject, Injectable } from '@nestjs/common';

import Twitch from "./platforms/twitch/twitch";
import { AuthProviderManager } from "../auth/auth-provider-manager.service";
import { StreamingPlatformConfig } from "../config/streaming-platform.config";
import { ConfigType } from "@nestjs/config";

@Injectable()
export class PlatformManagerService {
  constructor(
    private readonly authProviderManager: AuthProviderManager,
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
  }

  getPlatform(id: string): StreamingPlatform | void {
    return this.platforms.find((p) => p.id === id);
  }

  getPlatforms(): StreamingPlatform[] {
    return this.platforms;
  }

  triggerLoginUpdate(platformId: string, streamerAccount?: Account, botAccount?: Account) {
    const platform = this.getPlatform(platformId);
    if (!platform) {
      return;
    }
    
    platform.onLoginUpdate(streamerAccount, botAccount);
  }
}
