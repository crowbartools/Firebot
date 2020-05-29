"use strict";
const EventEmitter = require("events");
const channelAccess = require("./channel-access");
const frontendCommunicator = require("./frontend-communicator");


const chat = require("../chat/chat");
const constellation = require("../live-events/mixer-constellation");
const mixplay = require("../interactive/mixplay");
const integrationManager = require("../integrations/IntegrationManager");

let isOnline = false;
let onlineCheckIntervalId;

/**
 * @type ConnectionManager
 */
let manager;

function updateOnlineStatus(online) {
    if (online !== isOnline) {
        isOnline = online === true;
        manager.emit("streamerOnlineChange", isOnline);
    }
}

async function checkOnline() {
    let isOnline = await channelAccess.getStreamerOnlineStatus();
    updateOnlineStatus(isOnline);
}

class ConnectionManager extends EventEmitter {
    constructor() {
        super();
    }

    startOnlineCheckInterval() {
        if (onlineCheckIntervalId != null) {
            clearInterval(onlineCheckIntervalId);
        }
        checkOnline();
        onlineCheckIntervalId = setInterval(checkOnline, 10000);
    }

    setOnlineStatus(online) {
        updateOnlineStatus(online);
    }

    streamerIsOnline() {
        return isOnline;
    }

    updateChatConnection(shouldConnect) {
        if (shouldConnect) {
            if (chat.chatIsConnected()) {
                chat.connect();
            }
        } else {
            chat.disconnect();
        }
    }

    updateMixPlayConnection(shouldConnect) {
        if (shouldConnect) {
            if (mixplay.mixplayIsConnected()) {
                mixplay.connect();
            }
        } else {
            mixplay.disconnect();
        }
    }

    updateConstellationConnection(shouldConnect) {
        if (shouldConnect) {
            if (constellation.getConstellationStatus()) {
                constellation.connect();
            }
        } else {
            constellation.disconnect();
        }
    }

    updateIntegrationConnection(integrationId, shouldConnect) {
        if (shouldConnect) {
            integrationManager.connectIntegration(integrationId);
        } else {
            integrationManager.disconnectIntegration(integrationId);
        }
    }

}
manager = new ConnectionManager();

function updateServiceConnection(serviceId, shouldConnect) {
    switch (serviceId) {
    case "interactive":
        manager.updateMixPlayConnection(shouldConnect);
        break;
    case "chat":
        manager.updateChatConnection(shouldConnect);
        break;
    case "constellation":
        manager.updateConstellationConnection(shouldConnect);
        break;
    default:
        if (serviceId.startsWith("integration.")) {
            const integrationId = serviceId.replace("integration.", "");
            manager.updateIntegrationConnection(integrationId, shouldConnect);
        }
    }
}


frontendCommunicator.on("connect-all-sidebar-services", () => {

});

frontendCommunicator.on("disconnect-all-sidebar-services", () => {

});

frontendCommunicator.on("connect-service", (serviceId) => {
    updateServiceConnection(serviceId, true);
});

frontendCommunicator.on("disconnect-service", (serviceId) => {
    updateServiceConnection(serviceId, false);
});

module.exports = manager;
