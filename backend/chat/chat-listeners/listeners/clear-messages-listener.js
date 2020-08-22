"use strict";

module.exports = {
    accountType: "streamer",
    event: "ClearMessages",
    callback: (data) => {
        const eventManager = require("../../../events/EventManager");

        data.fbEvent = "ClearMessages";
        renderWindow.webContents.send("chatUpdate", data);

        eventManager.triggerEvent("mixer", "chat-cleared", {
            username: data.clearer.user_name,
            data: data
        });
    }
};