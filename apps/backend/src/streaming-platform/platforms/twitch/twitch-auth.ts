import { StaticAuthProvider } from "@twurple/auth";
import { Account } from "firebot-types";
import { twitchApiClient } from "./twitch-api-client";

class TwitchAccountAuthProvider {
  streamerProvider: StaticAuthProvider | null = null;
  botProvider: StaticAuthProvider | null = null;

  clientId: string | undefined = undefined;

  setClientId(clientId: string) {
    this.clientId = clientId;
  }

  async setupAccountProviders(streamerAccount?: Account, botAccount?: Account) {
    if (streamerAccount) {
      this.streamerProvider = new StaticAuthProvider(
        this.clientId!,
        streamerAccount.tokenData.accessToken!,
        STREAMER_SCOPES
      );
    } else {
      this.streamerProvider = null;
    }
    if (botAccount) {
      this.botProvider = new StaticAuthProvider(
        this.clientId!,
        botAccount.tokenData.accessToken!,
        BOT_SCOPES
      );
    } else {
      this.botProvider = null;
    }

    twitchApiClient.setupApiClients(
      this.streamerProvider
        ? {
            userId: streamerAccount!.userId,
            authProvider: this.streamerProvider,
          }
        : undefined,
      this.botProvider
        ? {
            userId: botAccount!.userId,
            authProvider: this.botProvider,
          }
        : undefined
    );
  }
}

export const twitchAccountAuthProvider = new TwitchAccountAuthProvider();

export const STREAMER_SCOPES = [
  "bits:read",
  "channel:edit:commercial",
  "channel:manage:ads",
  "channel:manage:broadcast",
  "channel:manage:moderators",
  "channel:manage:polls",
  "channel:manage:predictions",
  "channel:manage:raids",
  "channel:manage:redemptions",
  "channel:manage:schedule",
  "channel:manage:videos",
  "channel:manage:vips",
  "channel:moderate",
  "channel:read:ads",
  "channel:read:charity",
  "channel:read:editors",
  "channel:read:goals",
  "channel:read:hype_train",
  "channel:read:polls",
  "channel:read:predictions",
  "channel:read:redemptions",
  "channel:read:stream_key",
  "channel:read:subscriptions",
  "channel:read:vips",
  "chat:edit",
  "chat:read",
  "clips:edit",
  "moderation:read",
  "moderator:manage:announcements",
  "moderator:manage:automod",
  "moderator:manage:automod_settings",
  "moderator:manage:banned_users",
  "moderator:manage:blocked_terms",
  "moderator:manage:chat_messages",
  "moderator:manage:chat_settings",
  "moderator:manage:shield_mode",
  "moderator:manage:shoutouts",
  "moderator:read:automod_settings",
  "moderator:read:blocked_terms",
  "moderator:read:chat_settings",
  "moderator:read:chatters",
  "moderator:read:followers",
  "moderator:read:shield_mode",
  "moderator:read:shoutouts",
  "user:edit:broadcast",
  "user:manage:blocked_users",
  "user:manage:whispers",
  "user:read:blocked_users",
  "user:read:broadcast",
  "user:read:chat",
  "user:read:follows",
  "user:read:subscriptions",
  "whispers:edit",
  "whispers:read",
];

export const BOT_SCOPES = [
  "channel:moderate",
  "chat:edit",
  "chat:read",
  "moderator:manage:announcements",
  "user:manage:whispers",
  "user:read:chat",
  "whispers:edit",
  "whispers:read",
];
