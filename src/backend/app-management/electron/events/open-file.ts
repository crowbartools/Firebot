import { Event } from "electron";
import { checkForFirebotSetupInPath } from "../../file-open-helpers";
import logger from "../../../logwrapper";

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