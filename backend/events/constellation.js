"use strict";

const { ipcMain } = require("electron");
const EventEmitter = require("events");
const logger = require("../logwrapper");
const accountAccess = require("../common/account-access");
const constellationListeners = require("./constellation-listeners/constellation-listener-manager").listeners;

const { Carina, State } = require("carina");

Carina.WebSocket = require("ws");

/**@extends NodeJS.EventEmitter */
class MixerConstellation extends EventEmitter {
    constructor() {
        super();

        /** @type {Carina} */
        this._constellation = new Carina({ isBot: true });

        this._constellation.socket.on("state", (state) => {
            if (state === State.Connected) {
                this.emit("connected");

                logger.info("Constellation connected.");
            } else if (state === State.Closing) {
                this.emit("disconnected");
            } else if (state === State.Reconnecting) {
                this.emit("reconnecting");
            } else if (state === State.Connecting) {
                this.emit("connecting");
            }
        });

        this._constellation.on('error', data => {
            logger.error("error from constellation:", data);
        });
    }

    connect() {
        const streamer = accountAccess.getAccounts().streamer;
        if (!streamer.loggedIn) {
            this.disconnect();
            return;
        }

        // unsub any previous events
        if (this._constellation.subscriptions != null) {
            const eventSlugs = Object.keys(this._constellation.subscriptions);
            for (const slug of eventSlugs) {
                this._constellation.unsubscribe(slug);
            }
        }

        // subscribe all listener events
        for (const listener of constellationListeners) {
            const eventSlug = listener.event.replace('{streamerChannelId}', streamer.channelId);
            this._constellation.subscribe(eventSlug, listener.callback);
        }

        logger.info("Connecting to Constellation...");
        this._constellation.open();
    }

    disconnect() {
        if (this._constellation.socket.getState() === State.Idle) {
            //already disconnected
            this.emit("disconnected");
        } else {
            this._constellation.close();
        }
    }

    constellationIsConnected() {
        return this._constellation.socket.state === State.Connected;
    }
}

const mixerConstellation = new MixerConstellation();

ipcMain.on("mixerConstellation", function(event, status) {
    if (status === "connect" || status === "connected") {
        mixerConstellation.connect();
    } else {
        mixerConstellation.disconnect();
    }
});

ipcMain.on("gotConstellationRefreshToken", function() {
    mixerConstellation.connect();
});

module.exports = mixerConstellation;