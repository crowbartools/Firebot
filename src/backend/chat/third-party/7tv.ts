import { ThirdPartyEmote, ThirdPartyEmoteProvider } from "./third-party-emote-provider";
import axios from "axios";
import accountAccess from "../../common/account-access";
import logger from "../../logwrapper";

export class SevenTVEmoteProvider implements ThirdPartyEmoteProvider {
    globalEmoteUrl = "https://api.7tv.app/v2/emotes/global";    
    getChannelEmotesUrl = () => `https://api.7tv.app/v2/users/${accountAccess.getAccounts().streamer.userId}/emotes`;

    async getAllEmotes(): Promise<ThirdPartyEmote[]> {
        let globalEmotes = [];
        try {
            globalEmotes = (await axios.get(this.globalEmoteUrl)).data;

            if (!Array.isArray(globalEmotes)) {
                logger.warn(`Invalid global 7TV emote response: ${JSON.stringify(globalEmotes)}`);
                globalEmotes = [];
            }
        } catch (error) {
            logger.error("Failed to get global 7TV emotes", error.message);
        }

        let channelEmotes = [];
        try {
            channelEmotes = (await axios.get(this.getChannelEmotesUrl())).data;

            if (!Array.isArray(channelEmotes)) {
                logger.warn(`Invalid channel 7TV emote response: ${JSON.stringify(channelEmotes)}`);
                channelEmotes = [];
            }
        } catch (error) {
            logger.error("Failed to get channel 7TV emotes:", error.message);
        }

        return [
            ...globalEmotes,
            ...channelEmotes
        ].map(e => ({
            url: e.urls[0][1],
            code: e.name,
            origin: "7TV",
            animated: e.mime && e.mime.toLowerCase() === "image/gif"
        }));
    }
}