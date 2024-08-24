"use strict";

import { Event } from "electron";
import { checkForFirebotSetupInPath } from "../../file-open-helpers";

export function openFile(event: Event, path: string) {
    if (event.defaultPrevented) {
        return;
    }

    const logger = require("../../../logwrapper");

    logger.debug(`Received Firebot open file request: ${path}`);

    const isSetup = checkForFirebotSetupInPath(path);

    if (isSetup) {
        event.preventDefault();
    }
}