import { UserProfile } from "SharedTypes/firebot/profile";
import { LogLevel } from "../misc/logging";

export default interface IpcEvents {
    rendererLog: {
        level: LogLevel;
        message: string;
        meta?: unknown;
        stack?: unknown;
    };
    mainLog: {
        level: LogLevel;
        message: string;
        meta?: unknown[];
    };
    activeProfileChanged: UserProfile;
}
