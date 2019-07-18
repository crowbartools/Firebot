"use strict";
const EventEmitter = require("events");
const io = require("socket.io-client");
const authManager = require("../../authManager");
const request = require("request");

const integrationDefinition = {
    id: "streamlabs",
    name: "Streamlabs",
    description: "Donation and Extra Life Donation events"
};

const EVENT_SOURCE_ID = "streamlabs";
const EventId = {
    DONATION: "donation",
    EXTRA_LIFE_DONATION: "eldonation"
};

const eventSourceDefinition = {
    id: EVENT_SOURCE_ID,
    name: "Streamlabs",
    description: "Donation events from Streamlabs",
    events: [
        {
            id: EventId.DONATION,
            name: "Donation",
            description: "When someone donates to you.",
            cached: false,
            queued: true
        },
        {
            id: EventId.EXTRA_LIFE_DONATION,
            name: "Extra Life Donation",
            description: "When someone donates to your Extra Life campaign.",
            cached: false,
            queued: true
        }
    ]
};

const authData = {
    settings: {
        clientId: "XtzRXbIUU9OZcU3siwNBXOSVFD8DGjYhkLmeUqYQ",
        clientSecret: "pJMm1ktVgtXkNEdhU5HIowQNCLxZyMLin0yu0q6b",
        authorizationUrl: "https://streamlabs.com/api/v1.0/authorize",
        tokenUrl: "https://streamlabs.com/api/v1.0/token",
        useBasicAuthorizationHeader: true
    },
    scopes: "donations.read socket.token"
};

function getStreamlabsSocketToken(accessToken) {
    return new Promise((res, rej) => {
        let options = {
            method: "GET",
            url: "https://streamlabs.com/api/v1.0/socket/token",
            qs: { access_token: accessToken } //eslint-disable-line camelcase
        };

        request(options, function(error, response, body) {
            if (error) return rej(error);

            body = JSON.parse(body);

            console.log(body.socket_token);
            res(body.socket_token);
        });
    });
}

class StreamlabsIntegration extends EventEmitter {
    constructor() {
        super();
        this.connected = false;
        this._socket = null;
    }
    init(linked, settings) {
        if (linked) {
            const eventManager = require("../EventManager");
            eventManager.registerEventSource(eventSourceDefinition);
        }
    }
    connect(settings) {
        console.log("attempting to connect sl...");
        console.log(settings);
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

        console.log("...connected");
        const eventManager = require("../EventManager");
        console.log("1");

        this._socket.on("event", eventData => {
            console.log(eventData);
            if (eventData === null) return;
            if (eventData.type === "donation") {
                let donoData = eventData.message[0];
                eventManager.triggerEvent(EVENT_SOURCE_ID, EventId.DONATION, {
                    formattedDonationAmmount: donoData.formatted_amount,
                    dononationAmount: donoData.amount,
                    donationMessage: donoData.message,
                    from: donoData.from
                });
            } else if (eventData.type === "eldonation") {
                let donoData = eventData.message[0];
                eventManager.triggerEvent(
                    EVENT_SOURCE_ID,
                    EventId.EXTRA_LIFE_DONATION,
                    {
                        formattedDonationAmmount: donoData.formatted_amount,
                        dononationAmount: donoData.amount,
                        donationMessage: donoData.message,
                        from: donoData.from
                    }
                );
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
    link() {
        return new Promise(async (resolve, reject) => {
            console.log("getting SL tokens...");
            let authResp;
            try {
                authResp = await authManager.issueAuthRequest(
                    authData.settings,
                    authData.scopes,
                    "streamlabs"
                );
            } catch (error) {
                console.log(error);
                return reject(error);
            }

            let tokens = {
                accessToken: authResp.access_token,
                refreshToken: authResp.refresh_token
            };

            console.log("tokens:");
            console.log(tokens);

            try {
                tokens.socketToken = await getStreamlabsSocketToken(tokens.accessToken);
            } catch (error) {
                console.log(error);
                return reject(error);
            }

            this.emit("settings-update", integrationDefinition.id, tokens);

            const eventManager = require("../EventManager");
            eventManager.registerEventSource(eventSourceDefinition);

            resolve(tokens);
        });
    }
    unlink() {
        return new Promise((resolve, reject) => {
            this._socket.close();
        });
    }
}

const integration = new StreamlabsIntegration();

module.exports = {
    definition: integrationDefinition,
    integration: integration
};
