import {
    PlatformEventEmitter,
    StreamingPlatform,
    StreamingPlatformAuthConfig,
} from "firebot-types";
import twitchApi from "./twitch-api";
import { TwitchChat } from "./twitch-chat";
import { StreamingPlatformConfig } from "../../../config/streaming-platform.config";
import { ConfigType } from "@nestjs/config";

class Twitch extends PlatformEventEmitter implements StreamingPlatform {
  constructor(
    private readonly streamingPlatformConfig: ConfigType<
      typeof StreamingPlatformConfig
    >
  ) {
    super();
  }

  id = "twitch";
  name = "Twitch";
  color = {
    bg: "#A96FFF",
    text: "#FFFFFF",
  };

  auth: StreamingPlatformAuthConfig = {
    type: "device",
    clientId: this.streamingPlatformConfig.twitch.clientId,
    deviceAuthorizationEndpoint: "",
    tokenEndpoint: "",
    streamerScopes: [],
    botScopes: [],
  };

  api = twitchApi;

  chat = new TwitchChat();

  init() {
    console.log("Twitch init");
  }

  disconnect() {
    this.emit("disconnected");
  }

  connect() {
    this.emit("connected");
  }
}

export default Twitch;
