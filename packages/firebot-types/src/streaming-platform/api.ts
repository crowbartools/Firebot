import { Channel } from "./channel";
import { Id } from "./helpers";
import { PlatformUser } from "./user";

export interface PlatformApi {
    getUser: (id: Id) => Promise<PlatformUser>;
    getUserByName: (username: string) => Promise<PlatformUser>;
    getUserByAccessToken: (accessToken: string) => Promise<PlatformUser>;
    getChannel: (id: Id) => Promise<Channel>;
    getChatUsers: (channelId: Id) => Promise<PlatformUser[]>;
    updateChannelInfo: (channelInfo: Partial<Pick<Channel, "title" | "category">>) => Promise<void>;
}
