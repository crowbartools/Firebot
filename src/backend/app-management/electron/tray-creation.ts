import path from "path";
import { type BrowserWindow, Menu, Tray, app, nativeImage } from "electron";

import { SettingsManager } from "../../common/settings-manager";

let mainTray: Tray;
let minimizedToTray = false;

function createNativeImage() {
    const iconPath =
        process.platform === "darwin"
            ? path.join(__dirname, "../../../gui/images/macTrayIcon.png")
            : path.join(__dirname, "../../../gui/images/logo_transparent_2.png");
    return nativeImage.createFromPath(iconPath);
};

/**
 * Reveal the main window safely on Linux Wayland.
 *
 * Electron 38.2+ / Chromium Ozone Wayland hits
 * `FATAL:wayland_toplevel_window.cc … Should not be called with kMinimized state`
 * if `show()` runs while the BrowserWindow is still minimized (electron#49253).
 * Always restore before show.
 */
function revealMainWindow(mainWindow: BrowserWindow): void {
    if (mainWindow.isDestroyed()) {
        return;
    }
    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }
    if (!mainWindow.isVisible()) {
        mainWindow.show();
    }
    mainWindow.focus();
    minimizedToTray = false;
}

export function createTray(mainWindow: BrowserWindow) {
    if (mainTray != null) {
        return;
    }

    const trayMenu = Menu.buildFromTemplate([
        {
            label: "Show",
            type: "normal",
            click: () => {
                revealMainWindow(mainWindow);
            }
        },
        {
            type: "separator"
        },
        {
            label: "Exit",
            type: "normal",
            click: () => {
                app.quit();
            }
        }
    ]);
    mainTray = new Tray(createNativeImage());
    mainTray.setToolTip("Firebot");
    mainTray.setContextMenu(trayMenu);

    mainTray.on("double-click", () => {
        revealMainWindow(mainWindow);
    });

    mainWindow.on("minimize", () => {
        if (SettingsManager.getSetting("MinimizeToTray") && minimizedToTray !== true) {
            // Leaving the window minimized while hidden is what triggers the
            // Wayland FATAL on the next show(). Clear minimized first, then hide.
            // Defer so we don't fight the in-progress minimize.
            minimizedToTray = true;
            setImmediate(() => {
                if (mainWindow.isDestroyed()) {
                    return;
                }
                if (mainWindow.isMinimized()) {
                    mainWindow.restore();
                }
                mainWindow.hide();
            });
        }
    });

    mainWindow.on("restore", () => {
        if (minimizedToTray) {
            if (!mainWindow.isVisible()) {
                mainWindow.show();
            }
            minimizedToTray = false;
        }

    });
    mainWindow.on("show", () => {
        if (minimizedToTray) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            minimizedToTray = false;
        }
    });
    mainWindow.on("focus", () => {
        if (minimizedToTray) {
            revealMainWindow(mainWindow);
        }
    });
};
