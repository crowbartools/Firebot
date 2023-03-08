"use strict";
const EventEmitter = require("events");
const io = require("socket.io-client");
const axios = require("axios").default;
const logger = require("../../../logwrapper");

const { secrets } = require("../../../secrets-manager");

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
            id: secrets.streamLabsClientId,
            secret: secrets.streamLabsClientSecret
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
        const response = await axios.get("https://streamlabs.com/api/v1.0/socket/token",
            {
                params: {
                    "access_token": accessToken
                }
            });

        if (response && response.data && response.data.socket_token) {
            return response.data.socket_token;
        }
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

        this._socket.on("event", eventData => {
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
