import {
    PlatformEventEmitter,
    StreamingPlatform,
} from "SharedTypes/streaming-platform";
import twitchApi from "./twitch-api";
import twitchChat from "./twitch-chat";

class Twitch extends PlatformEventEmitter implements StreamingPlatform {
    constructor() {
        super();
    }

    id = "twitch";
    name = "Twitch";
    api = twitchApi;

    chat = twitchChat;

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
