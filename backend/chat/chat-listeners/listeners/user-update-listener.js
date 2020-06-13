"use strict";

const userAccess = require("../../../common/user-access");

module.exports = {
    accountType: "streamer",
    event: "UserUpdate",
    callback: async data => {

        const user = await userAccess.getUser(data.user);
        data.username = user.username;

        data.fbEvent = "UserUpdate";
        renderWindow.webContents.send("chatUpdate", data);
    }
};