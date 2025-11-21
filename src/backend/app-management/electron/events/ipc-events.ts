import { app } from "electron";
import os from "os";
import frontendCommunicator from "../../../common/frontend-communicator";

export function setupIpcEvents() {
    frontendCommunicator.on("preload.getAppDetails", () => ({
        version: app.getVersion(),
        locale: app.getLocale(),
        isPackaged: app.isPackaged,
        os: {
            isWindows: process.platform === "win32",
            type: os.type(),
            release: os.release()
        }
    }));

    frontendCommunicator.on("preload.app.getPath",
        (params: Parameters<typeof app.getPath>) => app.getPath(...params)
    );

    frontendCommunicator.on("preload.app.getAppPath",
        () => app.getAppPath()
    );
};