"use strict";

const userdb = require("../../../database/userDatabase");

module.exports = {
    accountType: "streamer",
    event: "UserJoin",
    callback: (data) => {
        const eventManager = require("../../../live-events/EventManager");

        userdb.setChatUserOnline(data);

        data.fbEvent = "UserJoin";
        renderWindow.webContents.send("chatUpdate", data);

        eventManager.triggerEvent("mixer", "user-joined-chat", {
            username: data.username,
            data: data
        });
    }
};