import { Id } from "./helpers";
import { PlatformUser } from "./user";

export interface PlatformApi {
    getUser: (id: Id) => Promise<PlatformUser>;
    getUserByName: (username: string) => Promise<PlatformUser>;
}
