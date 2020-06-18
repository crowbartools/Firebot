"use strict";

const channelAccess = require("../../../common/channel-access");

module.exports = {
    event: "channel:{streamerChannelId}:update",
    /**
     * @argument {import('../../../mixer-api/resource/channels').MixerChannelSimple} newChannelData
     */
    callback: async (newChannelData) => {

        const eventsManager = require("../../EventManager");

        if (newChannelData.viewersCurrent != null) {
            renderWindow.webContents.send("currentViewersUpdate", {
                viewersCurrent: newChannelData.viewersCurrent
            });
        }

        const currentChannelData = await channelAccess.getStreamerChannelData();
        if (newChannelData.online != null) {

            if (newChannelData.online && !currentChannelData.online) {
                eventsManager.triggerEvent('mixer', 'stream-went-live');
            } else if (!newChannelData.online && currentChannelData.online) {
                eventsManager.triggerEvent('mixer', 'stream-gone-offline');
            }

            const connectionManager = require("../../../common/connection-manager");
            connectionManager.setOnlineStatus(newChannelData.online);
        }

        channelAccess.updateStreamerChannelData(newChannelData);
    }
};