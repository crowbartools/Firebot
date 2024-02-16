import { ThirdPartyEmote, ThirdPartyEmoteProvider } from "./third-party-emote-provider";

type SevenTVEmotesResponse = {
    emotes: Array<{
        name: string;
        data: {
            animated: boolean;
            host: {
                url: string;
                files: Array<{
                    name: string;
                    static_name: string;
                }>;
            }
        }
    }>
};

type SevenTVChannelEmotesResponse = {
    emote_set: SevenTVEmotesResponse
};

export class SevenTVEmoteProvider extends ThirdPartyEmoteProvider<SevenTVEmotesResponse, SevenTVChannelEmotesResponse> {
    providerName = "7TV";

    globalEmoteUrl = "https://7tv.io/v3/emote-sets/global";
    getChannelEmotesUrl(streamerUserId: number): string {
        return `https://7tv.io/v3/users/twitch/${streamerUserId}`;
    }

    private globalEmoteMapper(response: SevenTVEmotesResponse): ThirdPartyEmote[] {
        return response.emotes.map(e => ({
            url: `https:${e.data.host.url}/4x.webp`,
            code: e.name,
            animated: e.data.animated ?? false,
            origin: this.providerName
        }));
    }

    private channelEmoteMapper(response: SevenTVChannelEmotesResponse): ThirdPartyEmote[] {
        return response.emote_set.emotes.map(e => ({
            url: `https:${e.data.host.url}/4x.webp`,
            code: e.name,
            animated: e.data.animated ?? false,
            origin: this.providerName
        }));
    }

    globalEmotesMapper = this.globalEmoteMapper;
    channelEmotesMapper = this.channelEmoteMapper;
}