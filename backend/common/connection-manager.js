"use strict";
const EventEmitter = require("events");
const util = require("../utility");
const logger = require("../logwrapper");
const frontendCommunicator = require("./frontend-communicator");
const { settings } = require("./settings-access");
const twitchApi = require("../twitch-api/api");
const twitchChat = require("../chat/twitch-chat");
const twitchPubSubClient = require("../twitch-api/pubsub/pubsub-client");
const integrationManager = require("../integrations/IntegrationManager");
const accountAccess = require("../common/account-access");

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
    const username = accountAccess.getAccounts().streamer.username;
    const isOnline = await twitchApi.channels.getOnlineStatus(username);
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
twitchChat.on("connected", () => emitServiceConnectionUpdateEvents("chat", ConnectionState.Connected));
twitchChat.on("disconnected", () => emitServiceConnectionUpdateEvents("chat", ConnectionState.Disconnected));
twitchChat.on("connecting", () => emitServiceConnectionUpdateEvents("chat", ConnectionState.Connecting));
twitchChat.on("reconnecting", () => emitServiceConnectionUpdateEvents("chat", ConnectionState.Reconnecting));

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
        onlineCheckIntervalId = setInterval(checkOnline, 30000);
    }

    setOnlineStatus(online) {
        updateOnlineStatus(online);
    }

    streamerIsOnline() {
        return isOnline;
    }

    updateChatConnection(shouldConnect) {
        if (shouldConnect) {
            twitchChat.connect();
            twitchPubSubClient.createClient();
        } else {
            twitchChat.disconnect();
            twitchPubSubClient.removeListeners();
        }
        return true;
    }

    updateIntegrationConnection(integrationId, shouldConnect) {
        if (!integrationManager.integrationIsConnectable(integrationId)) {
            return false;
        }

        if (shouldConnect) {
            integrationManager.connectIntegration(integrationId);
        } else {
            integrationManager.disconnectIntegration(integrationId);
        }
        return true;
    }
}
manager = new ConnectionManager();

function updateServiceConnection(serviceId, shouldConnect) {
    switch (serviceId) {
    case "chat":
        return manager.updateChatConnection(shouldConnect);
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
        renderWindow.webContents.send("error", "You must sign into your Streamer Twitch account before connecting.");
    } else if (accountAccess.streamerTokenIssue()) {
        const botTokenIssue = accountAccess.getAccounts().bot.loggedIn && accountAccess.botTokenIssue();

        const message = `There is an issue with the Streamer ${botTokenIssue ? ' and Bot' : ""} Twitch account${botTokenIssue ? 's' : ""}. Please re-sign into the account${botTokenIssue ? 's' : ""} and try again.`;
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
