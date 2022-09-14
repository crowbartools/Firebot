import { ThirdPartyEmote, ThirdPartyEmoteProvider } from "./third-party-emote-provider";
import axios from "axios";
import accountAccess from "../../common/account-access";
import logger from "../../logwrapper";

export class BTTVEmoteProvider implements ThirdPartyEmoteProvider {
    globalEmoteUrl = "https://api.betterttv.net/3/cached/emotes/global";    
    getChannelEmotesUrl = () => `https://api.betterttv.net/3/cached/users/twitch/${accountAccess.getAccounts().streamer.userId}`;

    async getAllEmotes(): Promise<ThirdPartyEmote[]> {
        let globalEmotes = [];
        try {
            globalEmotes = (await axios.get(this.globalEmoteUrl)).data;

            if (!Array.isArray(globalEmotes)) {
                logger.warn(`Invalid global BTTV emote response: ${JSON.stringify(globalEmotes)}`);
                globalEmotes = [];
            }
        } catch (error) {
            logger.error("Failed to get global bttv emotes", error.message);
        }

        let channelEmotes = [];
        try {
            const channelEmoteData = (await axios.get(this.getChannelEmotesUrl())).data;

            if (!Array.isArray(channelEmoteData.channelEmotes) || !Array.isArray(channelEmoteData.sharedEmotes)) {
                logger.warn(`Invalid channel BTTV emote response: ${JSON.stringify(channelEmoteData)}`);
                channelEmotes = [];
            } else {
                channelEmotes = [
                    ...channelEmoteData.channelEmotes,
                    ...channelEmoteData.sharedEmotes
                ];
            }
        } catch (error) {
            logger.error("Failed to get channel bttv emotes:", error.message);
        }

        return [
            ...globalEmotes,
            ...channelEmotes
        ].map(e => ({
            url: `https://cdn.betterttv.net/emote/${e.id}/1x`,
            code: e.code,
            origin: "BTTV",
            animated: e.imageType && e.imageType.toLowerCase() === "gif"
        }));
    }
}