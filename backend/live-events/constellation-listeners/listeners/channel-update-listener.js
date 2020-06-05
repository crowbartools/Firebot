"use strict";

//const connectionManager = require("../../../common/connection-manager");
const channelAccess = require("../../../common/channel-access");

module.exports = {
    event: "channel:{streamerChannelId}:update",
    callback: (data) => {
        if (data.viewersCurrent != null) {
            renderWindow.webContents.send("currentViewersUpdate", {
                viewersCurrent: data.viewersCurrent
            });
        }

        if (data.online != null) {
            //connectionManager.setOnlineStatus(data.online);
        }

        channelAccess.updateStreamerChannelData(data);
    }
};