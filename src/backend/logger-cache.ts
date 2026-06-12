import type { Logger } from "winston";
import logger from "./logwrapper";

/**
 * A utility class for the built-in Firebot {@link logger} that provides child loggers with module metadata included
 */
class LoggerCache {
    private _loggerCache: Record<string, Logger> = { };

    /**
     * Retrieves a logger child for the specified module from the cache, or creates it if one doesn't already exist.
     * @param module Name of the module
     * @returns A {@link Logger} that automatically includes the specified module name in its metadata
     */
    getLogger(module: string): Logger {
        if (this._loggerCache[module]) {
            return this._loggerCache[module];
        }

        return this._loggerCache[module] = logger.child({ module });
    }
}

const loggerCache = new LoggerCache();

export { loggerCache as LoggerCache };