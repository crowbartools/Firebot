export type DiscordCustomEmbed = {
    title?: string;
    url?: string;
    description?: string;
    authorName?: string;
    authorIconUrl?: string;
    imageUrl?: string;
};

export type DiscordEmbedType = "channel" | "stream" | "custom";
