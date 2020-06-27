"use strict";
const logger = require("../logwrapper");
const EventEmitter = require("events");
const ChatClient = require('twitch-chat-client').default;
const twitchClient = require("../twitch-api/client");
const accountAccess = require("../common/account-access");
const frontendCommunicator = require("../common/frontend-communicator");
const commandHandler = require("../chat/commands/commandHandler");

const chatHelpers = require("./chat-helpers");

/**@extends NodeJS.EventEmitter */
class TwitchChat extends EventEmitter {

    constructor() {
        super();

        /** @type {ChatClient} */
        this._streamerChatClient = null;

        /** @type {ChatClient} */
        this._botChatClient = null;
    }

    /**
     * Whether or not the streamer is currently connected
     */
    chatIsConnected() {
        return this._streamerChatClient != null && this._streamerChatClient.isConnected;
    }

    /**
     * Disconnects the streamer and bot from chat
     */
    async disconnect(emitDisconnectEvent = true) {
        if (this.chatIsConnected()) {
            await this._streamerChatClient.quit();
        }
        if (this._botChatClient != null && this._botChatClient.isConnected) {
            await this._botChatClient.quit();
        }
        if (emitDisconnectEvent) {
            this.emit("disconnected");
        }
    }

    /**
     * Connects the streamer and bot to chat
     */
    async connect() {
        const streamer = accountAccess.getAccounts().streamer;
        if (!streamer.loggedIn) return;

        const client = twitchClient.getClient();
        if (client == null) return;

        this.emit("connecting");
        await this.disconnect(false);

        try {
            this._streamerChatClient = await ChatClient.forTwitchClient(client, {
                requestMembershipEvents: true
            });

            this._streamerChatClient.onRegister(() => this._streamerChatClient.join(streamer.username));

            // listen to more events...
            await this._streamerChatClient.connect();

            await chatHelpers.cacheBadges();

            await chatHelpers.cacheStreamerEmotes();

            this._streamerChatClient.onPrivmsg(async (_channel, _user, _message, msg) => {
                const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg);

                // send to the frontend
                frontendCommunicator.send("twitch:chat:message", firebotChatMessage);

                commandHandler.handleChatMessage(firebotChatMessage);
            });

            this._streamerChatClient.onWhisper(async (_user, _message, msg) => {
                const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, true);
                frontendCommunicator.send("twitch:chat:message", firebotChatMessage);
            });

            this._streamerChatClient.onAction(async (_channel, _user, _message, msg) => {
                const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, false, true);
                frontendCommunicator.send("twitch:chat:message", firebotChatMessage);
            });

            this._streamerChatClient.onAction(async (_channel, _user, _message, msg) => {
                const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, false, true);
                frontendCommunicator.send("twitch:chat:message", firebotChatMessage);
            });

            this._streamerChatClient.onDisconnect((manual, reason) => {
                if (!manual) {
                    logger.error("Chat not manually disconnected", reason);
                    this.disconnect();
                }
            });

            this.emit("connected");
        } catch (error) {
            logger.error("Chat connect error", error);
            await this.disconnect();
        }
    }

    /**
     * Sends a chat message to the streamers chat (INTERNAL USE ONLY)
     * @param {string} message The message to send
     * @param {string} accountType The type of account to whisper with ('streamer' or 'bot')
     */
    async _say(message, accountType) {
        const chatClient = accountType === 'streamer' ? this._streamerChatClient : this._botChatClient;
        try {
            logger.debug(`Sending message as ${accountType}.`);
            const streamer = accountAccess.getAccounts().streamer;
            chatClient.say(streamer.username, message);

            const firebotChatMessage = await chatHelpers.buildFirebotChatMessageFromText(message);
            frontendCommunicator.send("twitch:chat:message", firebotChatMessage);
        } catch (error) {
            logger.error(`Error attempting to send message with ${accountType}`, error);
        }
    }

    /**
     * Sends the message as the bot if available, otherwise as the streamer.
     * If a username is provided, the message will be whispered.
     * If the message is too long, it will be automatically broken into multiple fragments and sent individually.
     *
     * @param {string} message The message to send
     * @param {string} [username] If provided, message will be whispered to the given user.
     * @param {string} [accountType] Which account to chat as. Defaults to bot if available otherwise, the streamer.
     */
    sendChatMessage(message, username, accountType) {
        if (message == null) return null;

        // Normalize account type
        if (accountType != null) {
            accountType = accountType.toLowerCase();
        }

        const botAvailable = accountAccess.getAccounts().bot.loggedIn && this._botSocket && this._botSocket.isConnected;
        if (accountType == null) {
            accountType = botAvailable ? "bot" : "streamer";
        } else if (accountType === "bot" && !botAvailable) {
            accountType = "streamer";
        }

        const shouldWhisper = username != null && username.trim() !== "";

        // split message into fragments that don't exceed the max message length
        const messageFragments = message.match(/[\s\S]{1,360}/g)
            .map(mf => mf.trim())
            .filter(mf => mf !== "");

        // Send all message fragments
        for (let fragment of messageFragments) {
            if (shouldWhisper) {
                //this._whisper(fragment, username, accountType)
            } else {
                this._say(fragment, accountType);
            }
        }
    }

    deleteMessage(messageId) {
        const streamer = accountAccess.getAccounts().streamer;
        if (this._streamerChatClient == null || !streamer.loggedIn) return;
        this._streamerChatClient.deleteMessage(streamer.username, messageId);
    }

    mod(username) {
        if (username == null) return;

        const streamer = accountAccess.getAccounts().streamer;

        return this._streamerChatClient.mod(streamer.username, username);
    }

    unmod(username) {
        if (username == null) return;

        const streamer = accountAccess.getAccounts().streamer;

        return this._streamerChatClient.unmod(streamer.username, username);
    }

    ban(username, reason) {
        if (username == null) return;

        const streamer = accountAccess.getAccounts().streamer;

        this._streamerChatClient.ban(streamer.username, username, reason);
    }

    unban(username) {
        if (username == null) return;

        const streamer = accountAccess.getAccounts().streamer;

        this._streamerChatClient.say(`#${streamer.username.replace("#", "")}`, `/unban ${username}`);
    }

    clearChat() {
        if (this._streamerChatClient == null) return;
        this._streamerChatClient.clear();
    }

    purgeUserMessages(username, reason = "") {
        const streamer = accountAccess.getAccounts().streamer;
        if (this._streamerChatClient == null || !streamer.loggedIn) return;
        this._streamerChatClient.purge(streamer.username, username, reason);
    }

    timeoutUser(username, duration = 600, reason = "") {
        const streamer = accountAccess.getAccounts().streamer;
        if (this._streamerChatClient == null || !streamer.loggedIn) return;
        this._streamerChatClient.timeout(streamer.username, username, duration, reason);
    }
}

const twitchChat = new TwitchChat();

frontendCommunicator.on("send-chat-message", sendData => {
    const { message, accountType } = sendData;

    twitchChat.sendChatMessage(message, null, accountType);
});

frontendCommunicator.on("delete-message", messageId => {
    //twitchChat.deleteMessage(messageId);
});

frontendCommunicator.on("update-user-mod-status", data => {
    if (data == null) return;
    const { username, shouldBeMod } = data;
    if (username == null || shouldBeMod == null) return;

    if (shouldBeMod) {
        //twitchChat.modUser(username);
    } else {
        //twitchChat.unmodUser(username);
    }
});

module.exports = twitchChat;



