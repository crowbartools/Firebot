import { BrowserWindow, ipcMain, Menu, shell } from "electron";
import windowStateKeeper from "electron-window-state";
import path from "path";
import { applicationMenu } from "./menu-builder";
import { communicator } from "SharedUtils";

let mainWindow: BrowserWindow = null;

export function getMainWindow(): BrowserWindow | null {
    return mainWindow;
}

export function createMainWindow() {
    if (mainWindow != null) {
        return mainWindow;
    }

    const mainWindowState = windowStateKeeper({
        defaultWidth: 1280,
        defaultHeight: 720,
    });

    mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        minWidth: 300,
        minHeight: 50,
        webPreferences: {
            nodeIntegration: false,
            preload: path.join(__dirname, "./preload.js"),
        },
    });

    // initialize IPC communicator
    communicator.init(ipcMain, mainWindow.webContents);

    mainWindow.webContents.on("new-window", function (e, url) {
        e.preventDefault();
        shell.openExternal(url);
    });

    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    mainWindow.webContents.once("dom-ready", () => {
        if (process.env.NODE_ENV !== "production") {
            mainWindow.webContents.openDevTools();
        }
    });

    if (process.env.NODE_ENV !== "production") {
        mainWindow.loadURL("http://localhost:2003");
    } else {
        mainWindow.loadFile(path.join(__dirname, "./index.html"));
    }

    Menu.setApplicationMenu(applicationMenu);

    return mainWindow;
}
