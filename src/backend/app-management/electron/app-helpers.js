"use strict";

exports.restartApp = () => {
    const { app } = require("electron");

    setTimeout(() => {
        app.relaunch({ args: process.argv.slice(1).concat(["--relaunch"]) });
        app.exit(0);
    }, 100);
};