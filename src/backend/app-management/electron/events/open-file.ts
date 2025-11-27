import type { Event } from "electron";
import logger from "../../../logwrapper";
import { checkForFirebotSetupInPath } from "../../file-open-helpers";

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