import { app } from "electron";

export function windowsAllClosed() {
    app.quit();
}
