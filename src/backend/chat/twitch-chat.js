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
const twitchApi = require("../twitch-api/api");
const chatRolesManager = require("../roles/chat-roles-manager");
const twitchSlashCommandHandler = require("./twitch-slash-command-handler");

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
        return this._streamerChatClient?.isConnected === true;
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

        await this.disconnect(false);

        logger.debug('[chat:connect] Starting chat...');

        const streamer = accountAccess.getAccounts().streamer;
        if (!streamer.loggedIn) {
            logger.warn('[chat:connect] Streamer Account not logged in');
            return;
        }

        const authProvider = refreshingAuthProvider.getRefreshingAuthProviderForStreamer();
        if (authProvider == null) {
            logger.warn('[chat:connect] Failed to get auth provider from streamer account');
            return;
        }
        logger.debug('[chat:connect] Attempting to connect to chat with streamer\'s account');
        this.emit("connecting");
        try {
            this._streamerChatClient = new ChatClient({
                authProvider: authProvider,
                requestMembershipEvents: true
            });

            this._streamerChatClient.onRegister(() => {
                this._streamerChatClient.join(streamer.username);
                frontendCommunicator.send("twitch:chat:autodisconnected", false);
            });

            this._streamerChatClient.onPasswordError((event) => {
                logger.error("[chat:connect] Failed to connect to chat", event);
                frontendCommunicator.send("error", `Unable to connect to chat. Reason: "${event.message}". Try signing out and back into your streamer/bot account(s).`);
                this.disconnect(true);
            });

            this._streamerChatClient.onConnect(() => {
                logger.info('[chat:connect] Connected streamer account to chat');
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
                    logger.error("[chat] Chat disconnected unexpectedly", reason);
                    frontendCommunicator.send("twitch:chat:autodisconnected", true);
                }
            });

            logger.debug('[chat:connect] calling streamerClient.connect()');
            await this._streamerChatClient.connect();
            logger.debug('[chat:connect] streamerClient.connect promise returned');

            logger.debug('[chat:connect] calling chatHelpers.handleChatConnect');
            await chatHelpers.handleChatConnect();
            logger.debug('[chat:connect] calling chatHelpers.handleChatConnect returned');

            twitchChatListeners.setupChatListeners(this._streamerChatClient);

            followPoll.startFollowPoll();
            chatterPoll.startChatterPoll();

            /* Vips the issue?
            logger.debug('[chat:connect] retrieving VIPs');
            const vips = await this._streamerChatClient.getVips(accountAccess.getAccounts().streamer.username);
            if (vips) {
                chatRolesManager.loadUsersInVipRole(vips);
            }
            logger.debug('[chat:connect] VIPs retrieved');
            */



        } catch (error) {
            logger.error("[chat:connect] Failed to connect to streamer's chat:", error.message);
            await this.disconnect();
            return;
        }

        const bot = accountAccess.getAccounts().bot;
        if (!bot.loggedIn) {
            logger.info('[chat:connect] No logged in bot account');
            return;
        }
        try {
            logger.info('[chat:connect] Connecting to chat with bot account');
            this._botChatClient = new ChatClient({
                authProvider: refreshingAuthProvider.getRefreshingAuthProviderForBot(),
                requestMembershipEvents: true
            });

            this._botChatClient.onRegister(() => this._botChatClient.join(streamer.username));

            twitchChatListeners.setupBotChatListeners(this._botChatClient);

            await this._botChatClient.connect();
            logger.info('[chat:connect] Connected bot account to chat');

        } catch (error) {
            logger.error("[chat:connect] Error joining streamer's chat channel with Bot account", error.message);
        }
    }

    /**
     * Sends a chat message to the streamers chat (INTERNAL USE ONLY)
     * @param {string} message The message to send
     * @param {string} accountType The type of account to whisper with ('streamer' or 'bot')
     */
    async _say(message, accountType, replyToId) {
        const chatClient = accountType === 'bot' ? this._botChatClient : this._streamerChatClient;
        try {
            logger.debug(`Sending message as ${accountType}.`);

            const streamer = accountAccess.getAccounts().streamer;
            chatClient.say(streamer.username, message, replyToId ? { replyTo: replyToId } : undefined);

            if (accountType === 'streamer' && (!message.startsWith("/") || message.startsWith("/me"))) {
                const firebotChatMessage = await chatHelpers.buildStreamerFirebotChatMessageFromText(message);
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
            logger.error(`[chat._say] Error attempting to send message with ${accountType}`, error.message);
        }
    }

    /**
     * Sends a whisper to the given user (INTERNAL USE ONLY)
     * @param {string} message The message to send
     * @param {string} accountType The type of account to whisper with ('streamer' or 'bot')
     */
    async _whisper(message, username = "", accountType) {
        const client = twitchApi.getClient();
        try {
            logger.debug(`Sending whisper as ${accountType} to ${username}.`);

            const recipient = await client.users.getUserByName(username);
            await twitchApi.whispers.sendWhisper(recipient.id, message, accountType === 'bot');
        } catch (error) {
            logger.error(`[chat._whisper] Error attempting to send whisper with ${accountType}`, error.message);
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
     * @param {string} [replyToMessageId] A message id to reply to
     */
    async sendChatMessage(message, username, accountType, replyToMessageId) {
        if (!(this instanceof TwitchChat)) {
            logger.error('[chat.sendChatMessage] Lost context of \'this\'');
        }

        if (message == null || message?.length < 1) {
            return null;
        }

        const shouldWhisper = username != null && username.trim() !== "";

        const accounts = accountAccess.getAccounts();
        if (shouldWhisper) {
            logger.info('[chat.sendChatMessage]: Sending message as whisper; using streamer account');
            accountType = 'streamer';

        } else if (accountType != null && accountType.toLowerCase() !== 'bot') {
            logger.info('[chat.sendChatMessage]: Bot account not requested for use; using streamer account');
            accountType = 'streamer';

        } else if (accounts.bot == null || accounts.bot.loggedIn !== true) {
            logger.warn(`[chat.sendChatMessage] Send as bot: Bot account not logged in; falling back to streamer account`);
            accountType = 'streamer';

        } else if (this._botChatClient == null) {
            logger.warn('[chat.sendChatMessage]: botChatClient is null; falling back to streamer account');
            accountType = 'streamer';

        } else if (this._botChatClient.isConnected !== true) {
            logger.warn('[chat.sendChatMessage]: botChatClient is not connected; falling back to streamer account');
            accountType = 'streamer';

        } else {
            logger.warn('[chat.sendChatMessage]: bot passed validation; using it to send message');
            accountType = 'bot';
        }

        const slashCommandValidationResult = twitchSlashCommandHandler.validateChatCommand(message);

        // If the slash command handler finds, validates, and successfully executes a command, no need to continue.
        if (slashCommandValidationResult != null && slashCommandValidationResult.success === true) {
            const slashCommandResult = await twitchSlashCommandHandler.processChatCommand(message, accountType === "bot");
            if (slashCommandResult === true) {
                return;
            }
        }

        // split message into fragments that don't exceed the max message length
        const messageFragments = message.match(/[\s\S]{1,500}/g)
            .map(mf => mf.trim())
            .filter(mf => mf !== "");

        // Send all message fragments
        for (const fragment of messageFragments) {
            if (shouldWhisper) {
                await this._whisper(fragment, username, accountType);
            } else {
                await this._say(fragment, accountType, replyToMessageId);
            }
        }
    }

    async populateChatterList() {
        await chatterPoll.runChatterPoll();
    }

    async getViewerList() {
        const users = activeUserHandler.getAllOnlineUsers();
        return users;
    }
}

const twitchChat = new TwitchChat();

frontendCommunicator.onAsync("send-chat-message", async (sendData) => {
    const { message, accountType } = sendData;

    // Run commands from firebot chat.
    if (accountType === "Streamer") {
        const firebotMessage = await chatHelpers.buildStreamerFirebotChatMessageFromText(message);
        commandHandler.handleChatMessage(firebotMessage);

        const twitchEventsHandler = require("../events/twitch-events");
        twitchEventsHandler.chatMessage.triggerChatMessage(firebotMessage);
    }

    await twitchChat.sendChatMessage(message, null, accountType);
});

frontendCommunicator.onAsync("delete-message", async (messageId) => {
    await twitchApi.chat.deleteChatMessage(messageId);
});

frontendCommunicator.onAsync("update-user-mod-status", async (data) => {
    if (data == null) {
        return;
    }
    const { username, shouldBeMod } = data;
    if (username == null || shouldBeMod == null) {
        return;
    }

    const user = await twitchApi.getClient().users.getUserByName(username);
    if (user == null) {
        return;
    }

    if (shouldBeMod) {
        await twitchApi.moderation.addChannelModerator(user.id);
    } else {
        await twitchApi.moderation.removeChannelModerator(user.id);
    }
});

frontendCommunicator.onAsync("update-user-banned-status", async (data) => {
    if (data == null) {
        return;
    }
    const { username, shouldBeBanned } = data;
    if (username == null || shouldBeBanned == null) {
        return;
    }

    const user = await twitchApi.getClient().users.getUserByName(username);
    if (user == null) {
        return;
    }

    if (shouldBeBanned) {
        await twitchApi.moderation.banUser(user.id, "Banned via Firebot");
    } else {
        await twitchApi.moderation.unbanUser(user.id);
    }
});

frontendCommunicator.onAsync("update-user-vip-status", async (data) => {
    if (data == null) {
        return;
    }
    const { username, shouldBeVip } = data;
    if (username == null || shouldBeVip == null) {
        return;
    }

    const user = await twitchApi.getClient().users.getUserByName(username);
    if (user == null) {
        return;
    }

    if (shouldBeVip) {
        await twitchApi.moderation.addChannelVip(user.id);
        chatRolesManager.addVipToVipList(username);
    } else {
        await twitchApi.moderation.removeChannelVip(user.id);
        chatRolesManager.removeVipFromVipList(username);
    }
});

module.exports = twitchChat;
