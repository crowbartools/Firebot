import path from "path";
import { type BrowserWindow, Menu, Tray, app, nativeImage } from "electron";

import { SettingsManager } from "../../common/settings-manager";
import frontendCommunicator from "../../common/frontend-communicator.js";

let mainTray: Tray;
let minimizedToTray = false;

function createNativeImage() {
    const iconPath =
        process.platform === "darwin"
            ? path.join(__dirname, "../../../gui/images/macTrayIcon.png")
            : path.join(__dirname, "../../../gui/images/logo_transparent_2.png");
    return nativeImage.createFromPath(iconPath);
};

export function createTray(mainWindow: BrowserWindow) {
    if (mainTray != null) {
        return;
    }

    const trayMenu = Menu.buildFromTemplate([
        {
            label: "Show",
            type: "normal",
            click: () => {
                if (minimizedToTray) {
                    mainWindow.show();
                    minimizedToTray = false;
                } else {
                    mainWindow.focus();
                }
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
        if (minimizedToTray) {
            mainWindow.show();
            minimizedToTray = false;
        } else {
            mainWindow.focus();
        }
    });

    mainWindow.on("minimize", () => {
        if (SettingsManager.getSetting("MinimizeToTray") && minimizedToTray !== true) {
            mainWindow.hide();
            minimizedToTray = true;
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
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            if (!mainWindow.isVisible()) {
                mainWindow.show();
            }
            minimizedToTray = false;
        }
    });

    frontendCommunicator.on("settings-updated-renderer", (evt: {
        path: string;
        data: unknown;
    }) => {
        if (
            evt.path === "/settings/minimizeToTray"
            && evt.data !== true
            && minimizedToTray === true
        ) {
            mainWindow.show();
            minimizedToTray = false;
        }
    });
};