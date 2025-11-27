import { app } from "electron";

export function restartApp() {
    setTimeout(() => {
        app.relaunch({ args: process.argv.slice(1).concat(["--relaunch"]) });
        app.exit(0);
    }, 100);
};