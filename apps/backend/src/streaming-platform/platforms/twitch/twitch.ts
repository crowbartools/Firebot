import {
  Account,
  ConnectionEventEmitter,
  StreamingPlatform,
  StreamingPlatformAuthConfig,
} from "firebot-types";
import twitchApi from "./twitch-api";
import { TwitchChat } from "./twitch-chat";
import { StreamingPlatformConfig } from "../../../config/streaming-platform.config";
import { ConfigType } from "@nestjs/config";
import { twitchAccountAuthProvider } from "streaming-platform/platforms/twitch/twitch-auth";

class Twitch extends ConnectionEventEmitter implements StreamingPlatform {
  constructor(
    private readonly streamingPlatformConfig: ConfigType<
      typeof StreamingPlatformConfig
    >
  ) {
    super();
    twitchAccountAuthProvider.setClientId(
      this.streamingPlatformConfig.twitch.clientId
    );
  }

  id = "twitch";
  name = "Twitch";
  icon = "twitch";

  auth: StreamingPlatformAuthConfig = {
    type: "device",
    clientId: this.streamingPlatformConfig.twitch.clientId,
    deviceAuthorizationEndpoint: "https://id.twitch.tv/oauth2/device",
    tokenEndpoint: "https://id.twitch.tv/oauth2/token",
    streamerScopes: [
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
    ],
    botScopes: [
      "channel:moderate",
      "chat:edit",
      "chat:read",
      "moderator:manage:announcements",
      "user:manage:whispers",
      "user:read:chat",
      "whispers:edit",
      "whispers:read",
    ],
  };

  api = twitchApi;

  chat = new TwitchChat();

  init(streamerAccount?: Account, botAccount?: Account) {
    twitchAccountAuthProvider.setupAccountProviders(
      streamerAccount,
      botAccount
    );
    console.log("Twitch init");
  }

  disconnect() {
    this.emit("disconnected");
  }

  connect() {
    this.emit("connected");
  }

  onLoginUpdate(streamerAccount?: Account, botAccount?: Account) {
    twitchAccountAuthProvider.setupAccountProviders(
      streamerAccount,
      botAccount
    );
    console.log("Twitch login update");
  }
}

export default Twitch;
