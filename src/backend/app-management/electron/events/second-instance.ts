import type { BrowserWindow, Event } from "electron";
import { LoggerCache } from "../../../logger-cache";

const logger = LoggerCache.getLogger("Core");

export async function secondInstance(event: Event, argv: string[]) {
    const { openUrl } = await import("./open-url");
    const { restartApp } = await import("../app-helpers");
    const { checkForFirebotSetupPathInArgs } = await import("../../file-open-helpers");

    // Someone tried to run a second instance, we should focus our window.
    try {
        logger.debug("Second instance detected, focusing main window.");

        const mainWindow = globalThis.renderWindow as BrowserWindow;
        if (mainWindow) {
            // Restore before show — Wayland Ozone FATAL if show() runs while minimized
            // (electron/electron#49253 / Chromium wayland_toplevel_window.cc).
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            if (!mainWindow.isVisible()) {
                mainWindow.show();
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