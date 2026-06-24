import { AccountAccess } from "../../common/account-access";
import { LoggerCache } from "../../logger-cache";

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
    private logger = LoggerCache.getLogger("Chat");

    abstract providerName: string;

    abstract globalEmoteUrl: string;
    abstract getChannelEmotesUrl(streamerUserId: string): string;

    abstract globalEmotesMapper(response: GlobalEmotesResponse): ThirdPartyEmote[];
    abstract channelEmotesMapper(response: ChannelEmotesResponse): ThirdPartyEmote[];

    async getAllEmotes(): Promise<ThirdPartyEmote[]> {
        let globalEmotes: ThirdPartyEmote[] = [];
        try {
            const globalEmotesResponse = await (await fetch(this.globalEmoteUrl)).json() as GlobalEmotesResponse;

            globalEmotes = this.globalEmotesMapper(globalEmotesResponse);

            if (!Array.isArray(globalEmotes)) {
                this.logger.warn(`Invalid global ${this.providerName} emote response: ${JSON.stringify(globalEmotes)}`);
                globalEmotes = [];
            }
        } catch (error) {
            this.logger.error(`Failed to get global ${this.providerName} emotes: ${(error as Error).message}`);
        }

        let channelEmotes: ThirdPartyEmote[] = [];
        try {
            const channelEmotesResponse = await (
                await fetch(this.getChannelEmotesUrl(AccountAccess.getAccounts().streamer.channelId))
            ).json() as ChannelEmotesResponse;

            channelEmotes = this.channelEmotesMapper(channelEmotesResponse);

            if (!Array.isArray(channelEmotes)) {
                this.logger.warn(`Invalid channel ${this.providerName} emote response: ${JSON.stringify(channelEmotes)}`);
                channelEmotes = [];
            }
        } catch (error) {
            this.logger.error(`Failed to get channel ${this.providerName} emotes: ${(error as Error).message}`);
        }

        return [...globalEmotes, ...channelEmotes];
    }
}
