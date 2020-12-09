"use strict";

exports.restartApp = () => {

    const { app } = require("electron");

    try {
        const chatModerationManager = require("../../chat/moderation/chat-moderation-manager");
        chatModerationManager.stopService();
    } catch (error) {
        //silently fail
    }

    setTimeout(() => {
        app.relaunch({ args: process.argv.slice(1).concat(["--relaunch"]) });
        app.exit(0);
    }, 100);
};