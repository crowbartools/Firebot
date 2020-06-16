"use strict";

module.exports = {
    accountType: "streamer",
    event: "PurgeMessage",
    callback: async data => {
        const eventManager = require("../../../events/EventManager");

        data.fbEvent = "PurgeMessage";
        renderWindow.webContents.send("chatUpdate", data);

        const userId = data.user_id;
        if (userId == null) return;

        const userAccess = require("../../../common/user-access");

        const user = await userAccess.getUser(userId);

        if (user) {
            if (!data.cause) return;
            if (data.cause.type === "timeout") {
                eventManager.triggerEvent("mixer", "messages-purged", {
                    username: user.username,
                    data: data
                });
            } else if (data.cause.type === "ban") {
                eventManager.triggerEvent("mixer", "user-banned", {
                    username: user.username,
                    data: data
                });
            }
        }
    }
};