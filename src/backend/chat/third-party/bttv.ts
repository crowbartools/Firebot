import { ThirdPartyEmote, ThirdPartyEmoteProvider } from "./third-party-emote-provider";

type BTTVEmotesReponse = Array<{
    id: string;
    code: string;
    imageType: string;
}>;

type BTTVChannelEmotesResponse = {
    channelEmotes: BTTVEmotesReponse;
    sharedEmotes: BTTVEmotesReponse;
};

export class BTTVEmoteProvider extends ThirdPartyEmoteProvider<BTTVEmotesReponse, BTTVChannelEmotesResponse> {
    providerName = "BTTV";

    globalEmoteUrl = "https://api.betterttv.net/3/cached/emotes/global";
    getChannelEmotesUrl(streamerUserId: number): string {
        return `https://api.betterttv.net/3/cached/users/twitch/${streamerUserId}`;
    }

    private emoteMapper(response: BTTVEmotesReponse): ThirdPartyEmote[] {
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