"use strict";

const electron = require("electron");
const { app } = electron;

const path = require("path");
const fs = require("fs");
const dataAccess = require("../common/data-access.js");

exports.handleSquirrelEvents = () => {
    if (process.platform === "win32") {

        const { ProgId, Regedit, ShellOption } = require('electron-regedit');

        new ProgId({
            description: 'Firebot',
            appName: "firebot",
            friendlyAppName: "Firebot",
            squirrel: "Firebot v5.exe",
            icon: './resources/firebot-setup-file-icon.ico',
            extensions: ['firebotsetup'],
            shell: [
                new ShellOption({ verb: ShellOption.OPEN, selected: true })
            ]
        });

        let cp;
        let updateDotExe;
        let target;
        let child;
        switch (process.argv[1]) {
            case "--squirrel-updated":
            case "--squirrel-install": //eslint-disable-line no-fallthrough
            // Optional - do things such as:
            // - Install desktop and start menu shortcuts
            // - Add your .exe to the PATH
            // - Write to the registry for things like file associations and explorer context menus

                Regedit.installAll().finally(() => {
                // Install shortcuts
                    if (process.argv[1] === "--squirrel-install") {
                        cp = require("child_process");
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
                    cp = require("child_process");
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