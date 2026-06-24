import { app } from "electron";
import { LoggerCache } from "../../../logger-cache";

const logger = LoggerCache.getLogger("Core");

export function windowsAllClosed() {
    logger.debug("All windows closed triggered");

    app.quit();
};