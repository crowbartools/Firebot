import { ThirdPartyEmote, ThirdPartyEmoteProvider } from "./third-party-emote-provider";

type BTTVEmotesResponse = Array<{
    id: string;
    code: string;
    imageType: string;
}>;

type BTTVChannelEmotesResponse = {
    channelEmotes: BTTVEmotesResponse;
    sharedEmotes: BTTVEmotesResponse;
};

export class BTTVEmoteProvider extends ThirdPartyEmoteProvider<BTTVEmotesResponse, BTTVChannelEmotesResponse> {
    providerName = "BTTV";

    globalEmoteUrl = "https://api.betterttv.net/3/cached/emotes/global";
    getChannelEmotesUrl(streamerUserId: number): string {
        return `https://api.betterttv.net/3/cached/users/twitch/${streamerUserId}`;
    }

    private emoteMapper(response: BTTVEmotesResponse): ThirdPartyEmote[] {
        return response.map(e => ({
            url: `https://cdn.betterttv.net/emote/${e.id}/1x`,
            code: e.code,
            animated: e.imageType && e.imageType.toLowerCase() === "gif",
            origin: this.providerName
        }));
    }

    globalEmotesMapper = this.emoteMapper;

    channelEmotesMapper(response: BTTVChannelEmotesResponse): ThirdPartyEmote[] {
        return [
            ...this.emoteMapper(response.channelEmotes),
            ...this.emoteMapper(response.sharedEmotes)
        ];
    }
}