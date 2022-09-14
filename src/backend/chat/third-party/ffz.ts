import { ThirdPartyEmote, ThirdPartyEmoteProvider } from "./third-party-emote-provider";
import axios from "axios";
import accountAccess from "../../common/account-access";
import logger from "../../logwrapper";

export class FFZEmoteProvider implements ThirdPartyEmoteProvider {
    globalEmoteUrl = "https://api.betterttv.net/3/cached/frankerfacez/emotes/global";    
    getChannelEmotesUrl = () => `https://api.betterttv.net/3/cached/frankerfacez/users/twitch/${accountAccess.getAccounts().streamer.userId}`;

    async getAllEmotes(): Promise<ThirdPartyEmote[]> {
        let globalEmotes = [];
        try {
            globalEmotes = (await axios.get(this.globalEmoteUrl)).data;

            if (!Array.isArray(globalEmotes)) {
                logger.warn(`Invalid global FFZ emote response: ${JSON.stringify(globalEmotes)}`);
                globalEmotes = [];
            }
        } catch (error) {
            logger.error("Failed to get global FFZ emotes", error);
        }

        let channelEmotes = [];
        try {
            channelEmotes = (await axios.get(this.getChannelEmotesUrl())).data;

            if (!Array.isArray(channelEmotes)) {
                logger.warn(`Invalid channel FFZ emote response: ${JSON.stringify(channelEmotes)}`);
                channelEmotes = [];
            }
        } catch (error) {
            logger.error("Failed to get channel FFZ emotes", error);
        }

        return [
            ...globalEmotes,
            ...channelEmotes
        ].map(e => ({
            url: e.images && e.images["1x"],
            code: e.code,
            origin: "FFZ",
            animated: e.imageType && e.imageType.toLowerCase() === "gif"
        }));
    }
}