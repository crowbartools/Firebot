import { ThirdPartyEmote, ThirdPartyEmoteProvider } from "./third-party-emote-provider";

type FFZEmotesResponse = Array<{
    images: {
        "1x": string;
    };
    code: string;
    imageType: string;
}>;

export class FFZEmoteProvider extends ThirdPartyEmoteProvider<FFZEmotesResponse> {
    providerName = "FFZ";

    globalEmoteUrl = "https://api.betterttv.net/3/cached/frankerfacez/emotes/global";
    getChannelEmotesUrl(streamerUserId: number): string {
        return `https://api.betterttv.net/3/cached/frankerfacez/users/twitch/${streamerUserId}`;
    }

    private emoteMapper = (response: FFZEmotesResponse): ThirdPartyEmote[] =>
        response.map((e) => ({
            url: e.images && e.images["1x"],
            code: e.code,
            animated: e.imageType?.toLowerCase() === "gif",
            origin: this.providerName
        }));

    globalEmotesMapper = this.emoteMapper;
    channelEmotesMapper = this.emoteMapper;
}