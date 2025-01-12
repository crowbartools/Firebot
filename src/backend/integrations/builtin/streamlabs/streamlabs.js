"use strict";
const EventEmitter = require("events");
const io = require("socket.io-client");
const logger = require("../../../logwrapper");

const { SecretsManager } = require("../../../secrets-manager");

const slEventHandler = require("./events/streamlabs-event-handler");
const slEffectsLoader = require("./effects/streamlabs-effect-loader");

const integrationDefinition = {
    id: "streamlabs",
    name: "Streamlabs",
    description: "Donation and Extra Life Donation events",
    linkType: "auth",
    connectionToggle: true,
    authProviderDetails: {
        id: "streamlabs",
        name: "StreamLabs",
        redirectUriHost: "localhost",
        client: {
            id: SecretsManager.secrets.streamLabsClientId,
            secret: SecretsManager.secrets.streamLabsClientSecret
        },
        auth: {
            type: "code",
            tokenHost: 'https://streamlabs.com',
            tokenPath: '/api/v1.0/token',
            authorizePath: '/api/v1.0/authorize'
        },
        autoRefreshToken: false,
        scopes: 'donations.read socket.token wheel.write credits.write'
    }
};

const getStreamlabsSocketToken = async (accessToken) => {
    try {
        const response = await fetch(`https://streamlabs.com/api/v1.0/socket/token?access_token=${accessToken}`);

        if (response.ok) {
            const data = await response.json();
            return data.socket_token;
        }

        throw new Error(`Response failed with status ${response.status}`);
    } catch (error) {
        logger.error("Failed to get socket token for Streamlabs", error.message);
        return null;
    }
};

class StreamlabsIntegration extends EventEmitter {
    constructor() {
        super();
        this.connected = false;
        this._socket = null;
    }
    init() {
        slEventHandler.registerEvents();
        slEffectsLoader.registerEffects();
    }
    connect(integrationData) {
        const { settings } = integrationData;

        if (settings == null) {
            this.emit("disconnected", integrationDefinition.id);
            return;
        }

        this._socket = io(
            `https://sockets.streamlabs.com?token=${settings.socketToken}`,
            {
                transports: ["websocket"]
            }
        );

        this._socket.on("event", (eventData) => {
            slEventHandler.processStreamLabsEvent(eventData);
        });

        this.emit("connected", integrationDefinition.id);
        this.connected = true;
    }
    disconnect() {
        if (this._socket) {
            this._socket.close();
        }

        this.connected = false;

        this.emit("disconnected", integrationDefinition.id);
    }
    async link(linkData) {
        const { auth } = linkData;
        const socketToken = await getStreamlabsSocketToken(auth['access_token']);

        if (socketToken) {
            this.emit("settings-update", integrationDefinition.id, { socketToken });
        }
    }
    unlink() {
        if (this._socket) {
            this._socket.close();
        }
    }
}

module.exports = {
    definition: integrationDefinition,
    integration: new StreamlabsIntegration()
};
