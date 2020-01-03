"use strict";
const EventEmitter = require("events");
const io = require("socket.io-client");
const authManager = require("../../authManager");
const request = require("request");

const integrationDefinition = {
    id: "tipeeestream",
    name: "TipeeeStream",
    description: "Donation/tip events",
    linkType: "auth",
    authProviderDetails: {
        id: "tipeeestream",
        name: "TipeeeStream Account",
        client: {
            id: '9812_4ch93uuaqneogco4g8484kcs88cc8s0w8o0o0goo4skgsck0kk',
            secret: "2m1vzint5aw4cosgwgggcowsgwoggo8gk40k0ossoog8g4kg08"
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
            description: "When someone donates to you.",
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

        request(options, function(error, response, body) {
            if (error) return rej(error);

            body = JSON.parse(body);

            console.log(body.apiKey);
            res(body.apiKey);
        });
    });
}

class TipeeeStreamIntegration extends EventEmitter {
    constructor() {
        super();
        this.connected = false;
        this._socket = null;
    }
    init(linked, integrationData) {
        if (linked) {
            const eventManager = require("../EventManager");
            eventManager.registerEventSource(eventSourceDefinition);
        }
    }
    connect(integrationData) {
        console.log("attempting to connect tipeee...");
        let { settings, auth } = integrationData;
        if (settings == null) {
            this.emit("disconnected", integrationDefinition.id);
            return;
        }
        this._socket = io(`https://sso.tipeeestream.com:4242`);

        this._socket.emit("join-room", {
            room: settings.apiKey,
            username: "Firebot"
        });

        console.log("...connected");
        const eventManager = require("../EventManager");

        this._socket.on("new-event", data => {
            console.log(data);
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

        console.log("listening for events...");
    }
    disconnect() {
        console.log("DISCONNECTED STREAMLABS");
        this._socket.close();
        this.connected = false;

        this.emit("disconnected", integrationDefinition.id);
    }
    link(linkData) {
        return new Promise(async (resolve, reject) => {
            console.log("getting Tipeee api key...");

            let { auth } = linkData;

            let settings = {};
            try {
                settings.apiKey = await getTipeeeAPIKey(auth['access_token']);
            } catch (error) {
                console.log(error);
                return reject(error);
            }

            this.emit("settings-update", integrationDefinition.id, settings);

            const eventManager = require("../EventManager");
            eventManager.registerEventSource(eventSourceDefinition);

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
