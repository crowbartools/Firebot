import type { Event } from "electron";
import { mainWindow } from "../window-management";
import { openUrl } from "./open-url";
import { restartApp } from "../app-helpers";
import * as fileOpenHelpers from "../../file-open-helpers";
import logger from "../../../logwrapper";

export function secondInstance(event: Event, argv: string[]) {
    // Someone tried to run a second instance, we should focus our window.
    try {
        logger.debug("Second instance detected, focusing main window.");
        if (mainWindow) {
            if (!mainWindow.isVisible()) {
                mainWindow.show();
            }
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();


            fileOpenHelpers.checkForFirebotSetupPathInArgs(argv);

            void openUrl(event, argv.pop());
        }
    } catch (error) {
        logger.debug("Error focusing", error);
        // something has gone terribly wrong with this instance,
        // attempt restart
        restartApp();
    }
};