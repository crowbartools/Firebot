"use strict";
const logger = require("../logwrapper");
const EventEmitter = require("events");
const ChatClient = require('twitch-chat-client').default;
const twitchClient = require("../twitch-api/client");
const accountAccess = require("../common/account-access");


/**@extends NodeJS.EventEmitter */
class TwitchChat extends EventEmitter {

    constructor() {
        super();

        /** @type {ChatClient} */
        this._streamerChatClient = null;

        /** @type {ChatClient} */
        this._botChatClient = null;
    }

    chatIsConnected() {
        return this._streamerChatClient != null && this._streamerChatClient.isConnected;
    }

    async disconnect(emitDisconnectEvent = true) {
        if (this.chatIsConnected()) {
            await this._streamerChatClient.quit();
        }
        if (emitDisconnectEvent) {
            this.emit("disconnected");
        }
    }

    async connect() {
        const streamer = accountAccess.getAccounts().streamer;
        if (!streamer.loggedIn) return;

        const client = twitchClient.getClient();
        if (client == null) return;

        this.emit("connecting");

        try {
            await this.disconnect(false);

            this._streamerChatClient = await ChatClient.forTwitchClient(client);

            this._streamerChatClient.onRegister(() => this._streamerChatClient.join(streamer.username));

            // listen to more events...
            await this._streamerChatClient.connect();

            this._streamerChatClient.onPrivmsg((channel, user, message, msg) => {
                if (message === '!ping') {
                    this._streamerChatClient.say(channel, 'Pong!');
                }
            });

            this.emit("connected");
        } catch (error) {
            logger.error("Chat connect error", error);
            await this.disconnect();
        }
    }
}

module.exports = new TwitchChat();



