import { TypedEmitter } from "tiny-typed-emitter";
import type { HelixStream } from "@twurple/api";

import { ConnectionState } from "../../shared/connection-constants";

import { SettingsManager } from "./settings-manager";
import { TwitchApi } from "../streaming-platforms/twitch/api";
import { TwitchEventSubClient } from "../streaming-platforms/twitch/api/eventsub/eventsub-client";
import * as effectHelpers from "../effects/effect-helpers";
import integrationManager from "../integrations/integration-manager";
import twitchChat from "../chat/twitch-chat";
import { LoggerCache } from "../logger-cache";
import frontendCommunicator from "./frontend-communicator";
import { wait } from "../utils";

const ONLINE_CHECK_INTERVAL = 30 * 1000;

type ServiceConnectionEventData = {
    serviceId: string;
    connectionState: ConnectionState;
};

type ServiceConnectionUpdateRequest = {
    id: string;
    action: boolean | "toggle";
};

type WaitingService = {
    serviceId: string;
    callback: () => void;
};

type ConnectionManagerEvents = {
    "streamerOnlineChange": (isOnline: boolean, stream: HelixStream) => void;
    "service-connection-update": (event: ServiceConnectionEventData) => void;
};

class ConnectionManager extends TypedEmitter<ConnectionManagerEvents> {
    private _logger = LoggerCache.getLogger("Connections");
    private _currentStream: HelixStream;
    private _onlineCheckIntervalId: NodeJS.Timeout;
    private _serviceConnectionStates: Record<string, ConnectionState> = {};
    private _connectionUpdateInProgress = false;
    private _currentlyWaitingService: WaitingService;

    constructor() {
        super();

        // Chat listeners
        twitchChat.on("connected", async () => {
            void this.onServiceConnectionUpdated("chat", ConnectionState.Connected);
            const rewardsManager = (await import("../channel-rewards/channel-reward-manager")).default;
            await rewardsManager.loadChannelRewards();
            await rewardsManager.refreshChannelRewardRedemptions();
        });

        twitchChat.on("disconnected",
            () => this.onServiceConnectionUpdated("chat", ConnectionState.Disconnected)
        );

        twitchChat.on("connecting",
            () => this.onServiceConnectionUpdated("chat", ConnectionState.Connecting)
        );

        twitchChat.on("reconnecting",
            () => this.onServiceConnectionUpdated("chat", ConnectionState.Reconnecting)
        );

        // Integrations listeners
        integrationManager.on("integration-connected",
            (id: string) => this.onServiceConnectionUpdated(`integration.${id}`, ConnectionState.Connected)
        );

        integrationManager.on("integration-disconnected",
            (id: string) => this.onServiceConnectionUpdated(`integration.${id}`, ConnectionState.Disconnected)
        );

        frontendCommunicator.onAsync("connect-sidebar-controlled-services", async () => {
            const serviceIds = SettingsManager.getSetting("SidebarControlledServices");

            await this.updateConnectionForServices(serviceIds.map(id => ({
                id,
                action: true
            })));
        });

        frontendCommunicator.on("disconnect-sidebar-controlled-services", () => {
            const serviceIds = SettingsManager.getSetting("SidebarControlledServices");
            for (const id of serviceIds) {
                this.updateServiceConnection(id, false);
            }
        });

        frontendCommunicator.on("connect-service", (serviceId: string) => {
            this.updateServiceConnection(serviceId, true);
        });

        frontendCommunicator.on("disconnect-service", (serviceId: string) => {
            this.updateServiceConnection(serviceId, false);
        });
    }

    private async onServiceConnectionUpdated(serviceId: string, connectionState: ConnectionState): Promise<void> {
        this._serviceConnectionStates[serviceId] = connectionState;

        const eventData = {
            serviceId,
            connectionState
        };
        this.emit("service-connection-update", eventData);
        frontendCommunicator.send("service-connection-update", eventData);

        if (this._currentlyWaitingService?.serviceId === serviceId
            && (connectionState === ConnectionState.Connected
                || connectionState === ConnectionState.Disconnected)
        ) {
            this._currentlyWaitingService.callback();
            this._currentlyWaitingService = null;
        }

        if (serviceId === "chat") {
            effectHelpers.setChatConnection(connectionState === ConnectionState.Connected);

            if (connectionState === ConnectionState.Connected) {
                const { EventManager } = await import("../events/event-manager");
                void EventManager.triggerEvent("firebot", "chat-connected");
            }
        }
    }

    private async checkOnline(): Promise<void> {
        const stream = await TwitchApi.streams.getStreamersCurrentStream();

        if (stream?.id !== this._currentStream?.id) {
            this._currentStream = stream;
            this.emit("streamerOnlineChange", stream != null, stream);
        }
    }

    startOnlineCheckInterval(): void {
        if (this._onlineCheckIntervalId != null) {
            clearInterval(this._onlineCheckIntervalId);
        }
        void this.checkOnline();
        this._onlineCheckIntervalId = setInterval(async () => await this.checkOnline(), ONLINE_CHECK_INTERVAL);
    }

    get streamerIsOnline(): boolean {
        return this._currentStream != null;
    }

    get currentStream(): HelixStream | null {
        return this._currentStream;
    }

    get chatIsConnected(): boolean {
        return twitchChat.chatIsConnected;
    }

    serviceIsConnected(serviceId: string): boolean {
        return this._serviceConnectionStates[serviceId] === ConnectionState.Connected;
    }

    updateChatConnection(shouldConnect: boolean): boolean {
        if (shouldConnect) {
            void twitchChat.connect();
            TwitchEventSubClient.createClient();
        } else {
            twitchChat.disconnect();
            TwitchEventSubClient.disconnectEventSub();
        }

        return true;
    }

    updateIntegrationConnection(integrationId: string, shouldConnect: boolean) {
        if (!integrationManager.integrationIsConnectable(integrationId)) {
            return false;
        }

        if (shouldConnect) {
            void integrationManager.connectIntegration(integrationId);
        } else {
            integrationManager.disconnectIntegration(integrationId);
        }

        return true;
    }

    updateServiceConnection(serviceId: string, shouldConnect: boolean): boolean {
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

    async updateConnectionForServices(services: ServiceConnectionUpdateRequest[]) {
        if (this._connectionUpdateInProgress) {
            return;
        }

        frontendCommunicator.send("toggle-connections-started");

        this._connectionUpdateInProgress = true;

        const { AccountAccess } = await import("./account-access");
        if (AccountAccess.getAccounts().streamer.loggedIn !== true) {
            frontendCommunicator.send("error", "You must sign into your Streamer Twitch account before connecting.");
        } else if (AccountAccess.streamerTokenIssue() === true) {
            const botTokenIssue = AccountAccess.getAccounts().bot.loggedIn
                    && AccountAccess.botTokenIssue();

            frontendCommunicator.send("accounts:invalidate-accounts", {
                streamer: true,
                bot: botTokenIssue
            });
        } else {
            const waitForServiceConnectDisconnect = (serviceId: string, action: boolean | "toggle" = true) => {
                const shouldToggle = action === "toggle";

                const shouldConnect = shouldToggle ? !this.serviceIsConnected(serviceId) : action;

                if (shouldConnect === this.serviceIsConnected(serviceId)) {
                    return Promise.resolve();
                }

                const promise = new Promise<void>((resolve) => {
                    this._currentlyWaitingService = {
                        serviceId: serviceId,
                        callback: () => resolve()
                    };
                });

                const willUpdate = this.updateServiceConnection(serviceId, shouldConnect);
                if (!willUpdate && this._currentlyWaitingService) {
                    this._currentlyWaitingService.callback();
                    this._currentlyWaitingService = null;
                }
                return promise;
            };

            try {
                for (const service of services) {
                    await wait(175);
                    await waitForServiceConnectDisconnect(service.id, service.action);
                }
            } catch (error) {
                this._logger.error("Error connecting services", error);
            }
        }

        this._connectionUpdateInProgress = false;

        this._currentlyWaitingService = null;

        await wait(250);
        frontendCommunicator.send("connect-services-complete");
    }
}

const manager = new ConnectionManager();

export { manager as ConnectionManager };