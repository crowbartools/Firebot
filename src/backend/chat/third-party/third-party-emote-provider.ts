export class ThirdPartyEmote {
    origin: string;
    url: string;
    code: string;
    animated: boolean;
}

export interface ThirdPartyEmoteProvider {
    globalEmoteUrl: string;
    getChannelEmotesUrl(): string;
    getAllEmotes(): Promise<ThirdPartyEmote[]>;
}