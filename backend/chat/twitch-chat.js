"use strict";
const logger = require("../logwrapper");
const EventEmitter = require("events");
const { ChatClient } = require("@twurple/chat");
const refreshingAuthProvider = require("../auth/refreshing-auth-provider");
const accountAccess = require("../common/account-access");
const frontendCommunicator = require("../common/frontend-communicator");
const chatHelpers = require("./chat-helpers");
const twitchChatListeners = require("./chat-listeners/twitch-chat-listeners");
const followPoll = require("../twitch-api/follow-poll");
const chatterPoll = require("../twitch-api/chatter-poll");
const commandHandler = require("./commands/commandHandler");
const activeUserHandler = require("./chat-listeners/active-user-handler");

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
        if (this._streamerChatClient != null) {
            await this._streamerChatClient.quit();
            this._streamerChatClient = null;
        }
        if (this._botChatClient != null && this._botChatClient.isConnected) {
            await this._botChatClient.quit();
            this._botChatClient = null;
        }
        if (emitDisconnectEvent) {
            this.emit("disconnected");
        }
        followPoll.stopFollowPoll();
        chatterPoll.stopChatterPoll();

        activeUserHandler.clearAllActiveUsers();

        const userDatabase = require("../database/userDatabase");
        await userDatabase.setAllUsersOffline();
    }

    /**
     * Connects the streamer and bot to chat
     */
    async connect() {
        const streamer = accountAccess.getAccounts().streamer;
        if (!streamer.loggedIn) return;

        const authProvider = refreshingAuthProvider.getRefreshingAuthProviderForStreamer();
        if (authProvider == null) return;

        this.emit("connecting");
        await this.disconnect(false);

        try {
            this._streamerChatClient = new ChatClient({
                authProvider: authProvider,
                requestMembershipEvents: true
            });

            this._streamerChatClient.onRegister(() => {
                this._streamerChatClient.join(streamer.username);
                frontendCommunicator.send("twitch:chat:autodisconnected", false);
            });

            this._streamerChatClient.onConnect(() => {
                this.emit("connected");
            });

            this._streamerChatClient.onAnyMessage((message) => {
                if (message.constructor.name === "UserState") {
                    const userData = message.tags;

                    const color = userData.get("color");
                    const badges = new Map(userData.get("badges").split(',').map(b => b.split('/', 2)));

                    chatHelpers.setStreamerData({
                        color,
                        badges
                    });
                }
            });

            this._streamerChatClient.onDisconnect((manual, reason) => {
                if (!manual) {
                    logger.error("Chat disconnected unexpectedly", reason);
                    frontendCommunicator.send("twitch:chat:autodisconnected", true);
                }
            });

            await this._streamerChatClient.connect();

            await chatHelpers.handleChatConnect();

            twitchChatListeners.setupChatListeners(this._streamerChatClient);

            followPoll.startFollowPoll();
            chatterPoll.startChatterPoll();
        } catch (error) {
            logger.error("Chat connect error", error);
            await this.disconnect();
        }

        try {
            this._botChatClient = new ChatClient({
                authProvider: refreshingAuthProvider.getRefreshingAuthProviderForBot(),
                requestMembershipEvents: true
            });

            this._botChatClient.onRegister(() => this._botChatClient.join(streamer.username));

            twitchChatListeners.setupBotChatListeners(this._botChatClient);

            await this._botChatClient.connect();
        } catch (error) {
            logger.error("Error joining streamers chat channel with Bot account", error);
        }
    }

    /**
     * Sends a chat message to the streamers chat (INTERNAL USE ONLY)
     * @param {string} message The message to send
     * @param {string} accountType The type of account to whisper with ('streamer' or 'bot')
     */
    async _say(message, accountType) {
        const chatClient = accountType === 'bot' ? this._botChatClient : this._streamerChatClient;
        try {
            logger.debug(`Sending message as ${accountType}.`);

            const streamer = accountAccess.getAccounts().streamer;
            chatClient.say(streamer.username, message);

            if (accountType === 'streamer' && (!message.startsWith("/") || message.startsWith("/me"))) {
                const firebotChatMessage = await chatHelpers.buildFirebotChatMessageFromText(message);
                await activeUserHandler.addActiveUser({
                    userId: firebotChatMessage.userId,
                    userName: firebotChatMessage.username,
                    displayName: firebotChatMessage.username
                }, true, false);
                //commandHandler.handleChatMessage(firebotChatMessage);
                frontendCommunicator.send("twitch:chat:message", firebotChatMessage);
                twitchChatListeners.events.emit("chat-message", firebotChatMessage);
            }
        } catch (error) {
            logger.error(`Error attempting to send message with ${accountType}`, error);
        }
    }

    /**
     * Sends a whisper to the given user (INTERNAL USE ONLY)
     * @param {string} message The message to send
     * @param {string} accountType The type of account to whisper with ('streamer' or 'bot')
     */
    async _whisper(message, username = "", accountType) {
        const chatClient = accountType === 'bot' ? this._botChatClient : this._streamerChatClient;
        try {
            logger.debug(`Sending whisper as ${accountType} to ${username}.`);

            const streamer = accountAccess.getAccounts().streamer;
            const whisperMessage = `/w @${username.replace("@", "")} ${message}`;
            chatClient.say(streamer.username, whisperMessage);
            //chatClient.whisper(username, message);
        } catch (error) {
            logger.error(`Error attempting to send whisper with ${accountType}`, error);
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

        const shouldWhisper = username != null && username.trim() !== "";

        const botAvailable = accountAccess.getAccounts().bot.loggedIn && this._botChatClient && this._botChatClient.isConnected;
        if (accountType == null) {
            accountType = botAvailable && !shouldWhisper ? "bot" : "streamer";
        } else if (accountType === "bot" && !botAvailable) {
            accountType = "streamer";
        }


        // split message into fragments that don't exceed the max message length
        const messageFragments = message.match(/[\s\S]{1,500}/g)
            .map(mf => mf.trim())
            .filter(mf => mf !== "");

        // Send all message fragments
        for (let fragment of messageFragments) {
            if (shouldWhisper) {
                this._whisper(fragment, username, accountType);
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

    block(username) {
        if (username == null) return;

        const twitchApi = require("../twitch-api/api");
        twitchApi.users.blockUserByName(username);
    }

    unblock(username) {
        if (username == null) return;

        const twitchApi = require("../twitch-api/api");
        twitchApi.users.unblockUserByName(username);
    }

    addVip(username) {
        if (username == null) return;

        const streamer = accountAccess.getAccounts().streamer;

        return this._streamerChatClient.addVip(streamer.username, username);
    }

    removeVip(username) {
        if (username == null) return;

        const streamer = accountAccess.getAccounts().streamer;

        return this._streamerChatClient.removeVip(streamer.username, username);
    }

    clearChat() {
        if (this._streamerChatClient == null) return;
        this._streamerChatClient.clear();
    }

    enableFollowersOnly(duration) {
        if (this._streamerChatClient == null) return;
        const streamer = accountAccess.getAccounts().streamer.username;

        if (duration == null) {
            this._streamerChatClient.enableFollowersOnly(streamer);
        } else {
            this._streamerChatClient.enableFollowersOnly(streamer, duration);
        }
    }

    disableFollowersOnly() {
        if (this._streamerChatClient == null) return;
        const streamer = accountAccess.getAccounts().streamer.username;
        this._streamerChatClient.disableFollowersOnly(streamer);
    }

    enableEmoteOnly() {
        if (this._streamerChatClient == null) return;
        const streamer = accountAccess.getAccounts().streamer.username;
        this._streamerChatClient.enableEmoteOnly(streamer);
    }

    disableEmoteOnly() {
        if (this._streamerChatClient == null) return;
        const streamer = accountAccess.getAccounts().streamer.username;
        this._streamerChatClient.disableEmoteOnly(streamer);
    }

    enableSubscribersOnly() {
        if (this._streamerChatClient == null) return;
        const streamer = accountAccess.getAccounts().streamer.username;
        this._streamerChatClient.enableSubsOnly(streamer);
    }

    disableSubscribersOnly() {
        if (this._streamerChatClient == null) return;
        const streamer = accountAccess.getAccounts().streamer.username;
        this._streamerChatClient.disableSubsOnly(streamer);
    }

    enableSlowMode(delay = 30) {
        if (this._streamerChatClient == null) return;
        const streamer = accountAccess.getAccounts().streamer.username;
        this._streamerChatClient.enableSlow(streamer, delay);
    }

    disableSlowMode() {
        if (this._streamerChatClient == null) return;
        const streamer = accountAccess.getAccounts().streamer.username;
        this._streamerChatClient.disableSlow(streamer);
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

    getViewerList() {
        // eslint-disable-next-line no-warning-comments
        //TODO: Needs updated for twitch.
        let users = [];
        return users;
    }
}

const twitchChat = new TwitchChat();

frontendCommunicator.on("send-chat-message", async sendData => {
    const { message, accountType } = sendData;

    // Run commands from firebot chat.
    if (accountType === "Streamer") {
        let firebotMessage = await chatHelpers.buildFirebotChatMessageFromText(message);
        commandHandler.handleChatMessage(firebotMessage);

        const twitchEventsHandler = require("../events/twitch-events");
        twitchEventsHandler.chatMessage.triggerChatMessage(firebotMessage);
    }

    twitchChat.sendChatMessage(message, null, accountType);
});

frontendCommunicator.on("delete-message", messageId => {
    twitchChat.deleteMessage(messageId);
});

frontendCommunicator.on("update-user-mod-status", data => {
    if (data == null) return;
    const { username, shouldBeMod } = data;
    if (username == null || shouldBeMod == null) return;

    if (shouldBeMod) {
        twitchChat.mod(username);
    } else {
        twitchChat.unmod(username);
    }
});

frontendCommunicator.on("update-user-banned-status", data => {
    if (data == null) return;
    const { username, shouldBeBanned } = data;
    if (username == null || shouldBeBanned == null) return;

    if (shouldBeBanned) {
        twitchChat.ban(username, "Banned via Firebot");
    } else {
        twitchChat.unban(username);
    }
});

module.exports = twitchChat;



