"use strict";
const EventEmitter = require("events");
const io = require("socket.io-client");
const logger = require("../../../logwrapper");
const { SecretsManager } = require("../../../secrets-manager");

const tsEventHandler = require("./events/tipeeestream-event-handler");

const integrationDefinition = {
    id: "tipeeestream",
    name: "TipeeeStream",
    description: "Donation events",
    connectionToggle: true,
    linkType: "auth",
    authProviderDetails: {
        id: "tipeeestream",
        name: "TipeeeStream",
        client: {
            id: SecretsManager.secrets.tipeeeStreamClientId,
            secret: SecretsManager.secrets.tipeeeStreamClientSecret
        },
        auth: {
            type: "code",
            tokenHost: 'https://api.tipeeestream.com',
            tokenPath: '/oauth/v2/token',
            authorizePath: '/oauth/v2/auth'
        },
        autoRefreshToken: false,
        scopes: ''
    }
};

const getTipeeeAPIKey = async (accessToken) => {
    try {
        const response = await fetch(`https://api.tipeeestream.com/v1.0/me/api?access_token=${accessToken}`);

        if (response.ok) {
            const data = await response.json();
            return data.apiKey;
        }

        throw new Error(`Request failed with status ${response.status}`);
    } catch (error) {
        logger.error("Failed to get TipeeeStream API key", error.message);
        return null;
    }
};

const getSocketUrl = async () => {
    try {
        const response = await (await fetch("https://api.tipeeestream.com/v2.0/site/socket")).json();

        if (response?.datas) {
            const data = response.datas;

            return `${data.host}:${data.port}`;
        }
    } catch (error) {
        logger.error("Failed to get TipeeeStream socket url", error.message);
        return null;
    }
};

class TipeeeStreamIntegration extends EventEmitter {
    constructor() {
        super();
        this.connected = false;
        this._socket = null;
    }
    init() {
        tsEventHandler.registerEvents();
    }
    async connect(integrationData) {
        const { settings } = integrationData;

        const apiKey = settings && settings.apiKey;

        if (apiKey == null) {
            this.emit("disconnected", integrationDefinition.id);
            return;
        }

        const url = await getSocketUrl();

        if (url == null) {
            this.emit("disconnected", integrationDefinition.id);
            return;
        }

        this._socket = io(url, {
            query: {
                'access_token': apiKey
            }
        });

        this._socket.on('connect', () => {
            this._socket.emit("join-room", {
                room: apiKey,
                username: "Firebot"
            });
        });

        this._socket.on("error", (err) => {
            logger.error(err);
            this.emit("disconnected", integrationDefinition.id);
        });

        this._socket.on('disconnect', function() {
            this.emit("disconnected", integrationDefinition.id);
        });

        this._socket.on("new-event", (data) => {
            const eventData = data.event;
            tsEventHandler.processTipeeeStreamEvent(eventData);
        });

        this.emit("connected", integrationDefinition.id);
        this.connected = true;
    }
    disconnect() {
        this._socket.close();
        this.connected = false;

        this.emit("disconnected", integrationDefinition.id);
    }
    async link(linkData) {
        const { auth } = linkData;

        const apiKey = await getTipeeeAPIKey(auth['access_token']);
        if (apiKey == null) {
            return;
        }

        this.emit("settings-update", integrationDefinition.id, { apiKey });
    }
    async unlink() {
        this._socket.close();
        return;
    }
}

const integration = new TipeeeStreamIntegration();

module.exports = {
    definition: integrationDefinition,
    integration: integration
};
