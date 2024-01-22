import {
    PlatformEventEmitter,
    StreamingPlatform,
} from "firebot-types";
import twitchApi from "./twitch-api";
import { TwitchChat } from "./twitch-chat";

class Twitch extends PlatformEventEmitter implements StreamingPlatform {
  constructor() {
    super();
  }

  id = "twitch";
  name = "Twitch";
  color = {
    bg: "#A96FFF",
    text: "#FFFFFF",
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
