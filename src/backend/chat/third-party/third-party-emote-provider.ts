export class ThirdPartyEmote {
    origin: string;
    url: string;
    code: string;
    animated: boolean;
}

export abstract class ThirdPartyEmoteProvider {
    globalEmoteUrl: string;
    abstract getChannelEmotesUrl(): string;
    abstract getAllEmotes(): Promise<ThirdPartyEmote[]>;
}