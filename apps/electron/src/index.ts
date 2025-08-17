import path from 'path';

import assetpath from 'assets';

import {
  app,
  BrowserWindow,
  dialog,
  MessageBoxSyncOptions,
  session,
  shell,
} from "electron";
import { type NestFastifyApplication } from "@nestjs/platform-fastify";
import { setBackendContext } from "backend-context";

// ts/eslint will complain until apps/backend/ has been built
const { default: backendStart } = require("backend");

let backend: { app: NestFastifyApplication | undefined; authToken?: string } = {
  app: undefined,
};

let mainWindow: BrowserWindow;
const createWindow = () => {
  if (mainWindow) {
    return;
  }

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(assetpath, "images/favicon.ico"),
  });

  mainWindow.webContents.setWindowOpenHandler(({ frameName, url }) => {
    if (frameName === "modal") {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          title: "Firebot",
          frame: true,
          titleBarStyle: "default",
          parent: mainWindow,
          width: 250,
          height: 400,
          javascript: false,
        },
      };
    }

    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-prevent-unload", (event) => {
    const options: MessageBoxSyncOptions = {
      type: "question",
      buttons: ["Cancel", "OK"],
      defaultId: 1,
      message: "You have unsaved changes. Do you want to leave?",
    };
    const response = dialog.showMessageBoxSync(mainWindow, options);
    if (response === 1) event.preventDefault();
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadURL("http://localhost:3001");
  }
};

process.on("uncaughtException", async function (err) {
  console.error(err.stack);
  if (backend.app != null) {
    await backend.app.close();
  }
  app.quit();
});

(async () => {
  setBackendContext({
    playSound: async (filePath: string) => {
      console.log(`Playing sound: ${filePath}`);
    },
  });

  backend = await backendStart({
    USER_DATA_PATH: app.getPath("userData"),
  });

  if (backend == null) {
    console.error("failed to start backend");
    app.quit();
    return;
  }

  await app.whenReady();

  app.on("window-all-closed", async () => {
    if (process.platform !== "darwin") {
      if (backend.app != null) {
        await backend.app.close();
      }
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  session.defaultSession.cookies.set({
    url: "http://localhost:3000",
    name: "auth",
    value: backend.authToken,
    httpOnly: false,
    secure: false,
  });

  createWindow();
})();