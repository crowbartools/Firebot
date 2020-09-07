import * as path from "path";

import { app, BrowserWindow } from "electron";

import installExtension, { REACT_DEVELOPER_TOOLS, MOBX_DEVTOOLS } from "electron-devtools-installer";

import comm from "./communicator";

let win: BrowserWindow | null;

const createWindow = () => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 275,
        webPreferences: {
            nodeIntegration: false,
            preload: path.join(__dirname, "./preload.js"),
        },
    });

    // initialize
    comm(win.webContents.send);

    comm().register('testMethod', async (data) => {
        console.log("TEST METHOD DATA", data.foo);
        return {
            bar: true
        }
    });

    win.webContents.once("dom-ready", () => {
        if (process.env.NODE_ENV !== "production") {
            win.webContents.openDevTools();
        }
    });

    win.on("closed", () => {
        win = null;
    });

    if (process.env.NODE_ENV !== "production") {
        win.loadURL("http://localhost:2003");
    } else {
        win.loadFile(path.join(__dirname, "./index.html"));
    }
};

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (win === null) {
        createWindow();
    }
});

app.whenReady()
    .then(async () => {
        if (process.env.NODE_ENV !== "production") {
            try {
                await installExtension(REACT_DEVELOPER_TOOLS, true);
                await installExtension(MOBX_DEVTOOLS, true);
            } catch(err) {
                console.log("failed to load extension(s)", err);
            }
        }
        createWindow();
    });
