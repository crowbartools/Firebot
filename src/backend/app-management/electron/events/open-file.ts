import type { Event } from "electron";
import { LoggerCache } from "../../../logger-cache";
import { checkForFirebotSetupInPath } from "../../file-open-helpers";

const logger = LoggerCache.getLogger("Core");

export function openFile(event: Event, path: string) {
    if (event.defaultPrevented) {
        return;
    }

    logger.debug(`Received Firebot open file request: ${path}`);

    const isSetup = checkForFirebotSetupInPath(path);

    if (isSetup) {
        event.preventDefault();
    }
}