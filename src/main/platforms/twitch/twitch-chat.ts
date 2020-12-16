import { ChatProvider } from "SharedTypes/streaming-platform";

class TwitchChat extends ChatProvider {
    constructor() {
        super();
    }
}

const twitchChat = new TwitchChat();
export default twitchChat;
