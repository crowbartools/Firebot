"use strict";
const EventEmitter = require("events");
const io = require("socket.io-client");
const request = require("request");
const logger = require("../../../logwrapper");

const integrationDefinition = {
    id: "tipeeestream",
    name: "TipeeeStream",
    description: "Donation events",
    linkType: "auth",
    authProviderDetails: {
        id: "tipeeestream",
        name: "TipeeeStream",
        client: {
            id: '12607_3f5rb6ma4w00kw0o0oskco00kkcoss0g4sgc8404wkososgo0w',
            secret: "2st2xi9eztgk400sg0o4ggko0kooo0gs80o08g8cw4o0w8c0go"
        },
        auth: {
            tokenHost: 'https://api.tipeeestream.com',
            tokenPath: '/oauth/v2/token',
            authorizePath: '/oauth/v2/auth'
        },
        scopes: ''
    }
};

const EVENT_SOURCE_ID = "tipeeestream";
const EventId = {
    DONATION: "donation"
};

const eventSourceDefinition = {
    id: EVENT_SOURCE_ID,
    name: "TipeeeStream",
    description: "Donation/tip events from tipeeestream",
    events: [
        {
            id: EventId.DONATION,
            name: "Donation",
            description: "When someone donates to you via TipeeeStream.",
            cached: false,
            queued: true
        }
    ]
};

function getTipeeeAPIKey(accessToken) {
    return new Promise((res, rej) => {
        let options = {
            method: "GET",
            url: "https://api.tipeeestream.com/v1.0/me/api",
            qs: { access_token: accessToken } //eslint-disable-line camelcase
        };

        request(options, function(error, _, body) {
            if (error) return rej(error);

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
            if (error) return rej(error);

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
        const eventManager = require("../../../live-events/EventManager");
        eventManager.registerEventSource(eventSourceDefinition);
    }
    async connect(integrationData) {
        let { auth } = integrationData;

        let apiKey = null;
        try {
            apiKey = await getTipeeeAPIKey(auth['access_token']);
        } catch (error) {
            logger.error(error);
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

        const eventManager = require("../../../live-events/EventManager");

        this._socket.on("new-event", data => {
            let eventData = data.event;
            if (eventData === null) return;
            if (eventData.type === "donation") {
                let donoData = eventData.parameters;
                eventManager.triggerEvent(EVENT_SOURCE_ID, EventId.DONATION, {
                    formattedDonationAmmount: eventData.formattedAmount,
                    dononationAmount: donoData.amount,
                    donationMessage: donoData.formattedMessage,
                    from: donoData.username
                });
            }
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
    unlink() {
        return new Promise((resolve) => {
            this._socket.close();
            resolve();
        });
    }
}

const integration = new TipeeeStreamIntegration();

module.exports = {
    definition: integrationDefinition,
    integration: integration
};
