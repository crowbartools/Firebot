"use strict";

module.exports = {
    accountType: "streamer",
    event: "DeleteMessage",
    callback: (data) => {
        const eventManager = require("../../../events/EventManager");

        data.fbEvent = "DeleteMessage";
        renderWindow.webContents.send("chatUpdate", data);

        eventManager.triggerEvent("mixer", "message-deleted", {
            username: data.moderator.user_name,
            data: data
        });
    }
};