"use strict";
const EventEmitter = require("events");
const util = require("../utility");
const logger = require("../logwrapper");
const channelAccess = require("./channel-access");
const frontendCommunicator = require("./frontend-communicator");
const { settings } = require("./settings-access");
const chat = require("../chat/chat");
const constellation = require("../events/constellation");
const mixplay = require("../interactive/mixplay");
const integrationManager = require("../integrations/IntegrationManager");

const { ConnectionState } = require("../../shared/connection-constants");

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

function emitServiceConnectionUpdateEvents(serviceId, connectionState) {
    const eventData = {
        serviceId: serviceId,
        connectionState: connectionState
    };
    manager.emit("service-connection-update", eventData);
    frontendCommunicator.send("service-connection-update", eventData);
}

// Chat listeners
chat.on("connected", () => emitServiceConnectionUpdateEvents("chat", ConnectionState.Connected));
chat.on("disconnected", () => emitServiceConnectionUpdateEvents("chat", ConnectionState.Disconnected));
chat.on("connecting", () => emitServiceConnectionUpdateEvents("chat", ConnectionState.Connecting));
chat.on("reconnecting", () => emitServiceConnectionUpdateEvents("chat", ConnectionState.Reconnecting));

// Constellation listeners
constellation.on("connected", () => emitServiceConnectionUpdateEvents("constellation", ConnectionState.Connected));
constellation.on("disconnected", () => emitServiceConnectionUpdateEvents("constellation", ConnectionState.Disconnected));
constellation.on("connecting", () => emitServiceConnectionUpdateEvents("constellation", ConnectionState.Connecting));
constellation.on("reconnecting", () => emitServiceConnectionUpdateEvents("constellation", ConnectionState.Reconnecting));

// Mixplay listeners
mixplay.events.on("connected", () => emitServiceConnectionUpdateEvents("interactive", ConnectionState.Connected));
mixplay.events.on("disconnected", () => emitServiceConnectionUpdateEvents("interactive", ConnectionState.Disconnected));
mixplay.events.on("connecting", () => emitServiceConnectionUpdateEvents("interactive", ConnectionState.Connecting));
mixplay.events.on("reconnecting", () => emitServiceConnectionUpdateEvents("interactive", ConnectionState.Reconnecting));

// Integrations listener
integrationManager.on("integration-connected", (id) => emitServiceConnectionUpdateEvents(`integration.${id}`, ConnectionState.Connected));
integrationManager.on("integration-disconnected", (id) => emitServiceConnectionUpdateEvents(`integration.${id}`, ConnectionState.Disconnected));

/**@extends NodeJS.EventEmitter */
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
            if (!chat.chatIsConnected()) {
                chat.connect();
            } else {
                return false;
            }
        } else {
            chat.disconnect();
        }
        return true;
    }

    updateMixPlayConnection(shouldConnect) {
        if (shouldConnect) {
            if (!mixplay.mixplayIsConnected()) {
                mixplay.connect();
            } else {
                return false;
            }
        } else {
            mixplay.disconnect();
        }
        return true;
    }

    updateConstellationConnection(shouldConnect) {
        if (shouldConnect) {
            if (!constellation.constellationIsConnected()) {
                constellation.connect();
            } else {
                return false;
            }
        } else {
            constellation.disconnect();
        }
        return true;
    }

    updateIntegrationConnection(integrationId, shouldConnect) {
        if (shouldConnect) {
            integrationManager.connectIntegration(integrationId);
        } else {
            integrationManager.disconnectIntegration(integrationId);
        }
        return true;
    }

    /**
     *
     * @param {string[]} serviceIds
     */
    toggleConnections(serviceIds) {
        for (const serviceId of serviceIds) {
            switch (serviceId) {
            case "interactive": {
                const shouldConnect = !mixplay.mixplayIsConnected();
                manager.updateMixPlayConnection(shouldConnect);
                break;
            }
            case "chat": {
                const shouldConnect = !chat.chatIsConnected();
                manager.updateChatConnection(shouldConnect);
                break;
            }
            case "constellation": {
                const shouldConnect = !constellation.constellationIsConnected();
                manager.updateConstellationConnection(shouldConnect);
                break;
            }
            default:
                //not supporting integrations for this yet
            }
        }
    }
}
manager = new ConnectionManager();

function updateServiceConnection(serviceId, shouldConnect) {
    switch (serviceId) {
    case "interactive":
        return manager.updateMixPlayConnection(shouldConnect);
    case "chat":
        return manager.updateChatConnection(shouldConnect);
    case "constellation":
        return manager.updateConstellationConnection(shouldConnect);
    default:
        if (serviceId.startsWith("integration.")) {
            const integrationId = serviceId.replace("integration.", "");
            return manager.updateIntegrationConnection(integrationId, shouldConnect);
        }
    }
    return false;
}

let currentlyWaitingService = null;
manager.on("service-connection-update", (data) => {
    if (currentlyWaitingService == null) return;

    let { serviceId, connectionState } = data;

    if (connectionState !== ConnectionState.Connected && connectionState !== ConnectionState.Disconnected) return;

    if (currentlyWaitingService.serviceId === serviceId) {
        currentlyWaitingService.callback();
        currentlyWaitingService = null;
    }
});

frontendCommunicator.on("connect-sidebar-controlled-services", async () => {
    const serviceIds = settings.getSidebarControlledServices();

    const accountAccess = require("./account-access");
    if (!accountAccess.getAccounts().streamer.loggedIn) {
        renderWindow.webContents.send("error", "You must sign into your Streamer Mixer account before connecting.");
    } else if (accountAccess.streamerTokenIssue()) {
        const botTokenIssue = accountAccess.getAccounts().bot.loggedIn && accountAccess.botTokenIssue();

        const message = `There is an issue with the Streamer ${botTokenIssue ? ' and Bot' : ""} Mixer account${botTokenIssue ? 's' : ""}. Please re-sign into the account${botTokenIssue ? 's' : ""} and try again.`;
        renderWindow.webContents.send("error", message);
    } else {
        const waitForServiceConnectDisconnect = (serviceId) => {
            const promise = new Promise(resolve => {
                currentlyWaitingService = {
                    serviceId: serviceId,
                    callback: () => resolve()
                };
            });
            const willUpdate = updateServiceConnection(serviceId, true);
            if (!willUpdate && currentlyWaitingService) {
                currentlyWaitingService.callback();
                currentlyWaitingService = null;
            }
            return promise;
        };

        try {
            for (const id of serviceIds) {
                await util.wait(175);
                await waitForServiceConnectDisconnect(id);
            }
        } catch (error) {
            logger.error("error connecting services", error);
        }
    }

    frontendCommunicator.send("connect-sidebar-controlled-services-complete");
});

frontendCommunicator.on("disconnect-sidebar-controlled-services", () => {
    const serviceIds = settings.getSidebarControlledServices();
    for (const id of serviceIds) {
        updateServiceConnection(id, false);
    }
});

frontendCommunicator.on("connect-service", (serviceId) => {
    updateServiceConnection(serviceId, true);
});

frontendCommunicator.on("disconnect-service", (serviceId) => {
    updateServiceConnection(serviceId, false);
});

module.exports = manager;
