import { ChannelCategory } from "./channel-category";
import { Id } from "./helpers";

export interface ChannelInfo {
    userId: Id;
    id: Id;
    title: string;
    category: Partial<ChannelCategory>;
    broadcasterLanguage?: string;
}
