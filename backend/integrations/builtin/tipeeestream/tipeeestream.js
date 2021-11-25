"use strict";
const EventEmitter = require("events");
const io = require("socket.io-client");
const request = require("request");
const logger = require("../../../logwrapper");
const { secrets } = require("../../../secrets-manager");

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
            id: secrets.tipeeeStreamClientId,
            secret: secrets.tipeeeStreamClientSecret
        },
        auth: {
            tokenHost: 'https://api.tipeeestream.com',
            tokenPath: '/oauth/v2/token',
            authorizePath: '/oauth/v2/auth'
        },
        autoRefreshToken: false,
        scopes: ''
    }
};

function getTipeeeAPIKey(accessToken) {
    return new Promise((res, rej) => {
        let options = {
            method: "GET",
            url: "https://api.tipeeestream.com/v1.0/me/api",
            qs: { access_token: accessToken } //eslint-disable-line camelcase
        };

        request(options, function(error, _, body) {
            if (error) {
                return rej(error);
            }

            body = JSON.parse(body);

            res(body.apiKey);
        });
    });
}

function getSocketUrl() {
    return new Promise((res, rej) => {
        let options = {
            method: "GET",
            url: "https://api.tipeeestream.com/v2.0/site/socket"
        };

        request(options, function(error, _, body) {
            if (error) {
                return rej(error);
            }

            body = JSON.parse(body);

            let data = body.datas;

            res(data.host + ":" + data.port);
        });
    });
}

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
        let { settings } = integrationData;

        let apiKey = settings && settings.apiKey;

        if (apiKey == null) {
            this.emit("disconnected", integrationDefinition.id);
            return;
        }

        let url;
        try {
            url = await getSocketUrl();
        } catch (error) {
            logger.error(error);
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

        this._socket.on("new-event", data => {
            let eventData = data.event;
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
    link(linkData) {
        return new Promise(async (resolve, reject) => {

            let { auth } = linkData;

            let settings = {};
            try {
                settings.apiKey = await getTipeeeAPIKey(auth['access_token']);
            } catch (error) {
                return reject(error);
            }

            this.emit("settings-update", integrationDefinition.id, settings);

            resolve(settings);
        });
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
