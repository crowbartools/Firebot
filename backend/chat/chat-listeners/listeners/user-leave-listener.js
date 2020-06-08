"use strict";

const userdb = require("../../../database/userDatabase");

module.exports = {
    accountType: "streamer",
    event: "UserLeave",
    callback: (data) => {
        const eventManager = require("../../../live-events/EventManager");

        userdb.setChatUserOffline(data.id);

        data.fbEvent = "UserLeave";
        renderWindow.webContents.send("chatUpdate", data);

        eventManager.triggerEvent("mixer", "user-left-chat", {
            username: data.username,
            data: data
        });
    }
};