import type { LogLevel } from "@d-fischer/logger";
import { LoggerCache } from "../../../logger-cache";

const twurpleLogger = LoggerCache.getLogger("Twurple");

// By default, we set Twurple logging to info because debug is EXTREMELY chatty
export function logTwurpleMessage(level: LogLevel, message: string) {
    switch (level as number) {
        case 0: // Critical
        case 1: // Error
            twurpleLogger.error(message);
            break;

        case 2: // Warning
            twurpleLogger.warn(message);
            break;

        case 3: // Info
            twurpleLogger.info(message);
            break;

        case 4: // Debug
            twurpleLogger.debug(message);
            break;
    }
}