import axios from "axios";
import accountAccess from "../../common/account-access";
import logger from "../../logwrapper";

export class ThirdPartyEmote {
    origin: string;
    url: string;
    code: string;
    animated: boolean;
}

export abstract class ThirdPartyEmoteProvider<
    GlobalEmotesResponse,
    ChannelEmotesResponse = GlobalEmotesResponse
> {
    abstract providerName: string;

    abstract globalEmoteUrl: string;
    abstract getChannelEmotesUrl(streamerUserId: number): string;

    abstract globalEmotesMapper(response: GlobalEmotesResponse): ThirdPartyEmote[];
    abstract channelEmotesMapper(response: ChannelEmotesResponse): ThirdPartyEmote[];

    async getAllEmotes(): Promise<ThirdPartyEmote[]>  {
        let globalEmotes: ThirdPartyEmote[] = [];
        try {
            const globalEmotesResponse = (await axios.get<GlobalEmotesResponse>(this.globalEmoteUrl)).data;
            
            globalEmotes = this.globalEmotesMapper(globalEmotesResponse);
            
            if (!Array.isArray(globalEmotes)) {
                logger.warn(`Invalid global ${this.providerName} emote response: ${JSON.stringify(globalEmotes)}`);
                globalEmotes = [];
            }
        } catch (error) {
            logger.error(`Failed to get global ${this.providerName} emotes`, error);
        }
    
        let channelEmotes: ThirdPartyEmote[] = [];
        try {
            const channelEmotesResponse = (
                await axios.get<ChannelEmotesResponse>(this.getChannelEmotesUrl(accountAccess.getAccounts().streamer.channelId))
            ).data;
                
            channelEmotes = this.channelEmotesMapper(channelEmotesResponse);
                
            if (!Array.isArray(channelEmotes)) {
                logger.warn(`Invalid channel ${this.providerName} emote response: ${JSON.stringify(channelEmotes)}`);
                channelEmotes = [];
            }
        } catch (error) {
            logger.error(`Failed to get channel ${this.providerName} emotes`, error);
        }
    
        return [...globalEmotes, ...channelEmotes];
    }
}