import { ChannelCategory } from "./channel-category";
import { Id } from "./helpers";

export interface Channel {
    userId: Id;
    platformId: string;
    id: Id;
    title: string;
    category: Partial<ChannelCategory>;
    broadcasterLanguage?: string;
}
