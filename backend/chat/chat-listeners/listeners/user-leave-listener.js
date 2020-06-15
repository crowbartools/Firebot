"use strict";

module.exports = {
    accountType: "streamer",
    event: "UserLeave",
    callback: (data) => {
        const eventManager = require("../../../events/EventManager");

        const userdb = require("../../../database/userDatabase");
        userdb.setChatUserOffline(data.id);

        data.fbEvent = "UserLeave";
        renderWindow.webContents.send("chatUpdate", data);

        eventManager.triggerEvent("mixer", "user-left-chat", {
            username: data.username,
            data: data
        });
    }
};