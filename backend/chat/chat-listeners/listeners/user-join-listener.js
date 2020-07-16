"use strict";



module.exports = {
    accountType: "streamer",
    event: "UserJoin",
    callback: (data) => {
        const eventManager = require("../../../events/EventManager");
        const userdb = require("../../../database/userDatabase");

        //userdb.setChatUserOnline(data);

        data.fbEvent = "UserJoin";
        renderWindow.webContents.send("chatUpdate", data);

        eventManager.triggerEvent("mixer", "user-joined-chat", {
            username: data.username,
            data: data
        });
    }
};