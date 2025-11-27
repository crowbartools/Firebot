/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { app } from "electron";
import { ProgId, Regedit, ShellOption } from "electron-regedit";
import path from "path";
import fs from "fs";
import cp from "child_process";

import * as dataAccess from "../common/data-access";

export function handleSquirrelEvents() {
    if (process.platform === "win32") {
        new ProgId({
            description: "Firebot",
            appName: "firebot",
            friendlyAppName: "Firebot",
            squirrel: "Firebot v5.exe",
            icon: "./resources/firebot-setup-file-icon.ico",
            extensions: ["firebotsetup"],
            shell: [
                new ShellOption({ verb: ShellOption.OPEN, selected: true })
            ]
        });

        let updateDotExe: string;
        let target: string;
        let child: cp.ChildProcess;
        switch (process.argv[1]) {
            case "--squirrel-updated":
            case "--squirrel-install":
            // Optional - do things such as:
            // - Install desktop and start menu shortcuts
            // - Add your .exe to the PATH
            // - Write to the registry for things like file associations and explorer context menus

                Regedit.installAll().finally(() => {
                // Install shortcuts
                    if (process.argv[1] === "--squirrel-install") {
                        updateDotExe = path.resolve(path.dirname(process.execPath), "..", "update.exe");
                        target = path.basename(process.execPath);
                        child = cp.spawn(updateDotExe, ["--createShortcut", target], {
                            detached: true
                        });
                        child.on("close", app.quit);
                    } else {
                        app.quit();
                    }
                });

                return false;
            case "--squirrel-uninstall": {
            // Undo anything you did in the --squirrel-install and --squirrel-updated handlers

                //attempt to delete the user-settings folder
                fs.rmSync(dataAccess.getPathInUserData("/profiles"), { recursive: true });
                fs.rmSync(dataAccess.getPathInUserData("global-settings.json"), { recursive: true });

                Regedit.uninstallAll().finally(() => {
                // Remove shortcuts
                    updateDotExe = path.resolve(
                        path.dirname(process.execPath),
                        "..",
                        "update.exe"
                    );
                    target = path.basename(process.execPath);
                    child = cp.spawn(updateDotExe, ["--removeShortcut", target], {
                        detached: true
                    });
                    child.on("close", app.quit);
                });

                return false;
            }
            case "--squirrel-obsolete":
            // This is called on the outgoing version of your app before
            // we update to the new version - it's the opposite of
            // --squirrel-updated
                app.quit();
                return false;
        }
    }
    return true;
};