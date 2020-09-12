import { registerStreamingPlatform } from "./platform-manager";
import Twitch from "./twitch/twitch";

export function loadPlatforms() {
    registerStreamingPlatform(new Twitch());
}
