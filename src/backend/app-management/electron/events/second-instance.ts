import type { BrowserWindow, Event } from "electron";
import logger from "../../../logwrapper";

export async function secondInstance(event: Event, argv: string[]) {
    const { openUrl } = await import("./open-url");
    const { restartApp } = await import("../app-helpers");
    const { checkForFirebotSetupPathInArgs } = await import("../../file-open-helpers");

    // Someone tried to run a second instance, we should focus our window.
    try {
        logger.debug("Second instance detected, focusing main window.");

        const mainWindow = globalThis.mainWindow as BrowserWindow;
        if (mainWindow) {
            if (!mainWindow.isVisible()) {
                mainWindow.show();
            }
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();

            checkForFirebotSetupPathInArgs(argv);

            void openUrl(event, argv.pop());
        }
    } catch (error) {
        logger.debug("Error focusing", error);
        // something has gone terribly wrong with this instance,
        // attempt restart
        restartApp();
    }
};