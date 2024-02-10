import { Channel } from "./channel";
import { Id } from "./helpers";
import { PlatformUser } from "./user";

export interface PlatformApi {
  getUser: (id: Id) => Promise<PlatformUser | undefined>;
  getUserByName: (username: string) => Promise<PlatformUser | undefined>;
  getUserByAccessToken: (
    accessToken: string
  ) => Promise<PlatformUser | undefined>;
  getChannel: (id: Id) => Promise<Channel | undefined>;
  getChatUsers: (channelId: Id) => Promise<PlatformUser[]>;
  updateChannelInfo: (
    channelInfo: Partial<Pick<Channel, "title" | "category">>
  ) => Promise<void>;
}
