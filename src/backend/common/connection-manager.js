"use strict";

const { EventEmitter } = require("events");

const { SettingsManager } = require("./settings-manager");
const { TwitchApi } = require("../streaming-platforms/twitch/api");
const { TwitchEventSubClient } = require("../streaming-platforms/twitch/api/eventsub/eventsub-client");
const effectHelpers = require("../effects/effect-helpers");
const integrationManager = require("../integrations/integration-manager");
const twitchChat = require("../chat/twitch-chat");
const frontendCommunicator = require("./frontend-communicator");
const logger = require("../logwrapper");
const { wait } = require("../utils");

const { ConnectionState } = require("../../shared/connection-constants");

/**
 * @type {import("@twurple/api").HelixStream | null}
 */
let currentStream = null;

let onlineCheckIntervalId;

/**
 * @type ConnectionManager
 */
let manager;

async function checkOnline() {
    const stream = await TwitchApi.streams.getStreamersCurrentStream();

    if (stream?.id !== currentStream?.id) {
        currentStream = stream;
        manager.emit("streamerOnlineChange", stream != null, stream);
    }
}

const serviceConnectionStates = {};

function emitServiceConnectionUpdateEvents(serviceId, connectionState) {

    serviceConnectionStates[serviceId] = connectionState;

    const eventData = {
        serviceId: serviceId,
        connectionState: connectionState
    };
    manager.emit("service-connection-update", eventData);
    frontendCommunicator.send("service-connection-update", eventData);

    if (serviceId === "chat") {
        effectHelpers.setChatConnection(connectionState === ConnectionState.Connected);

        if (connectionState === ConnectionState.Connected) {
            const { EventManager } = require("../events/event-manager");
            EventManager.triggerEvent("firebot", "chat-connected");
        }
    }
}

// Chat listeners
twitchChat.on("connected", () => {
    emitServiceConnectionUpdateEvents("chat", ConnectionState.Connected);
    const rewardsManager = require("../channel-rewards/channel-reward-manager");
    rewardsManager.loadChannelRewards().then(() => {
        rewardsManager.refreshChannelRewardRedemptions();
    });
});
twitchChat.on("disconnected", () => emitServiceConnectionUpdateEvents("chat", ConnectionState.Disconnected));
twitchChat.on("connecting", () => emitServiceConnectionUpdateEvents("chat", ConnectionState.Connecting));
twitchChat.on("reconnecting", () => emitServiceConnectionUpdateEvents("chat", ConnectionState.Reconnecting));

// Integrations listener
integrationManager.on("integration-connected", id => emitServiceConnectionUpdateEvents(`integration.${id}`, ConnectionState.Connected));
integrationManager.on("integration-disconnected", id => emitServiceConnectionUpdateEvents(`integration.${id}`, ConnectionState.Disconnected));

let connectionUpdateInProgress = false;

let currentlyWaitingService = null;


/**@extends EventEmitter */
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

    streamerIsOnline() {
        return currentStream != null;
    }

    get currentStream() {
        return currentStream;
    }

    chatIsConnected() {
        return twitchChat.chatIsConnected;
    }

    serviceIsConnected(serviceId) {
        return serviceConnectionStates[serviceId] === ConnectionState.Connected;
    }

    updateChatConnection(shouldConnect) {
        if (shouldConnect) {
            twitchChat.connect();
            TwitchEventSubClient.createClient();
        } else {
            twitchChat.disconnect();
            TwitchEventSubClient.disconnectEventSub();
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

    updateServiceConnection(serviceId, shouldConnect) {
        switch (serviceId) {
            case "chat":
                return this.updateChatConnection(shouldConnect);
            default:
                if (serviceId.startsWith("integration.")) {
                    const integrationId = serviceId.replace("integration.", "");
                    return this.updateIntegrationConnection(integrationId, shouldConnect);
                }
        }
        return false;
    }

    async updateConnectionForServices(services) {

        if (connectionUpdateInProgress) {
            return;
        }

        frontendCommunicator.send("toggle-connections-started");

        connectionUpdateInProgress = true;

        const { AccountAccess } = require("./account-access");
        if (!AccountAccess.getAccounts().streamer.loggedIn) {
            frontendCommunicator.send("error", "You must sign into your Streamer Twitch account before connecting.");
        } else if (AccountAccess.streamerTokenIssue()) {
            const botTokenIssue = AccountAccess.getAccounts().bot.loggedIn
                && AccountAccess.botTokenIssue();

            frontendCommunicator.send("accounts:invalidate-accounts", {
                streamer: true,
                bot: botTokenIssue
            });
        } else {
            const waitForServiceConnectDisconnect = (serviceId, action = true) => {
                const shouldToggle = action === "toggle";

                const shouldConnect = shouldToggle ? !this.serviceIsConnected(serviceId) : action;

                if (shouldConnect === this.serviceIsConnected(serviceId)) {
                    return Promise.resolve();
                }

                const promise = new Promise((resolve) => {
                    currentlyWaitingService = {
                        serviceId: serviceId,
                        callback: () => resolve()
                    };
                });

                const willUpdate = this.updateServiceConnection(serviceId, shouldConnect);
                if (!willUpdate && currentlyWaitingService) {
                    currentlyWaitingService.callback();
                    currentlyWaitingService = null;
                }
                return promise;
            };

            try {
                for (const service of services) {
                    await wait(175);
                    await waitForServiceConnectDisconnect(service.id, service.action);
                }
            } catch (error) {
                logger.error("error connecting services", error);
            }
        }

        connectionUpdateInProgress = false;

        currentlyWaitingService = null;

        await wait(250);
        frontendCommunicator.send("connect-services-complete");
    }
}
manager = new ConnectionManager();

manager.on("service-connection-update", (data) => {
    if (currentlyWaitingService == null) {
        return;
    }

    const { serviceId, connectionState } = data;

    if (connectionState !== ConnectionState.Connected && connectionState !== ConnectionState.Disconnected) {
        return;
    }

    if (currentlyWaitingService.serviceId === serviceId) {
        currentlyWaitingService.callback();
        currentlyWaitingService = null;
    }
});

frontendCommunicator.onAsync("connect-sidebar-controlled-services", async () => {
    const serviceIds = SettingsManager.getSetting("SidebarControlledServices");

    await manager.updateConnectionForServices(serviceIds.map(id => ({
        id,
        action: true
    })));
});

frontendCommunicator.on("disconnect-sidebar-controlled-services", () => {
    const serviceIds = SettingsManager.getSetting("SidebarControlledServices");
    for (const id of serviceIds) {
        manager.updateServiceConnection(id, false);
    }
});

frontendCommunicator.on("connect-service", (serviceId) => {
    manager.updateServiceConnection(serviceId, true);
});

frontendCommunicator.on("disconnect-service", (serviceId) => {
    manager.updateServiceConnection(serviceId, false);
});

module.exports = manager;
