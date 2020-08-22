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

        if (newChannelData.name) {
            if (newChannelData.name !== currentChannelData.name) {
                eventsManager.triggerEvent('mixer', 'stream-title-changed');
            }
        }

        if (newChannelData.typeId) {
            if (newChannelData.typeId !== currentChannelData.typeId) {
                eventsManager.triggerEvent('mixer', 'stream-game-changed');
            }
        }

        if (newChannelData.audience) {
            if (newChannelData.audience !== currentChannelData.audience) {
                eventsManager.triggerEvent('mixer', 'stream-audience-changed');
            }
        }

        channelAccess.updateStreamerChannelData(newChannelData);
    }
};