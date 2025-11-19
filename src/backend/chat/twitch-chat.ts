import { EventEmitter } from "events";
import { ChatClient } from "@twurple/chat";

import { AccountAccess } from "../common/account-access";
import { ActiveUserHandler } from "./active-user-handler";
import { FirebotDeviceAuthProvider } from "../auth/firebot-device-auth-provider";
import { SharedChatCache } from "../streaming-platforms/twitch/chat/shared-chat-cache";
import { TwitchApi } from "../streaming-platforms/twitch/api";
import chatHelpers from "./chat-helpers";
import chatRolesManager from "../roles/chat-roles-manager";
import twitchRolesManager from "../roles/twitch-roles-manager";
import chatterPoll from "../streaming-platforms/twitch/chatter-poll";
import twitchChatListeners from "./chat-listeners/twitch-chat-listeners";
import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";

class TwitchChat extends EventEmitter {
    private _streamerChatClient: ChatClient;
    private _botChatClient: ChatClient;

    constructor() {
        super();

        this._streamerChatClient = null;
        this._botChatClient = null;
    }

    /**
     * Whether or not the streamer is currently connected
     */
    get chatIsConnected(): boolean {
        return (
            this._streamerChatClient?.irc?.isConnected === true
        );
    }

    /**
     * Disconnects the streamer and bot from chat
     */
    disconnect(emitDisconnectEvent = true): void {
        if (this._streamerChatClient != null) {
            this._streamerChatClient.quit();
            this._streamerChatClient = null;
        }
        if (this._botChatClient != null && this._botChatClient?.irc?.isConnected === true) {
            this._botChatClient.quit();
            this._botChatClient = null;
        }
        if (emitDisconnectEvent) {
            this.emit("disconnected");
        }
        chatterPoll.stopChatterPoll();

        ActiveUserHandler.clearAllActiveUsers();
    }

    /**
     * Connects the streamer and bot to chat
     */
    async connect(): Promise<void> {
        const streamer = AccountAccess.getAccounts().streamer;
        if (!streamer.loggedIn) {
            return;
        }

        const streamerAuthProvider = FirebotDeviceAuthProvider.streamerProvider;
        if (streamerAuthProvider == null && FirebotDeviceAuthProvider.botProvider == null) {
            return;
        }

        this.emit("connecting");
        this.disconnect(false);

        try {

            await this.connectBotClient();

            this._streamerChatClient = new ChatClient({
                authProvider: streamerAuthProvider,
                requestMembershipEvents: true
            });

            this._streamerChatClient.irc.onRegister(() => {
                void this._streamerChatClient.join(streamer.username);
                frontendCommunicator.send("twitch:chat:autodisconnected", false);
            });

            this._streamerChatClient.irc.onPasswordError((event) => {
                logger.error("Failed to connect to chat", event);
                frontendCommunicator.send(
                    "error",
                    `Unable to connect to chat. Reason: "${event.message}". Try signing out and back into your streamer/bot account(s).`
                );
                this.disconnect(true);
            });

            this._streamerChatClient.irc.onConnect(() => {
                this.emit("connected");
            });

            this._streamerChatClient.irc.onDisconnect((manual, reason) => {
                if (!manual) {
                    logger.error("Incoming Chat disconnected unexpectedly", reason);
                    frontendCommunicator.send("twitch:chat:autodisconnected", true);
                }
            });

            this._streamerChatClient.connect();

            /**
             * DO NOT AWAIT THIS
             * This is just to cache badges/emotes/cheermotes
             * Fire and forget this so we can get everything else setup
            */
            void chatHelpers.cacheChatAssets();

            // Attempt to reload the known bot list in case it failed on start
            await chatRolesManager.cacheViewerListBots();

            chatterPoll.startChatterPoll();

            // Refresh these once we connect to Twitch
            // While connected, we can just react to changes via chat messages/EventSub events
            await twitchRolesManager.loadVips();
            await twitchRolesManager.loadModerators();

            if (!twitchRolesManager.getSubscribers().length) {
                await twitchRolesManager.loadSubscribers();
            }

            // Load the current Shared Chat session
            await SharedChatCache.loadSessionFromTwitch();
        } catch (error) {
            logger.error("Chat connect error", error);
            this.disconnect();
        }

        try {
            twitchChatListeners.setupChatListeners(this._streamerChatClient, this._botChatClient);
        } catch (error) {
            logger.error("Error setting up chat listeners", error);
        }
    }

    private connectBotClient(): Promise<void> {
        return new Promise((resolve) => {
            let hasResolved = false;
            const resolveIfNotResolved = () => {
                if (!hasResolved) {
                    hasResolved = true;
                    resolve();
                }
            };
            try {
                const { streamer, bot } = AccountAccess.getAccounts();

                if (bot.loggedIn) {

                    this._botChatClient = new ChatClient({
                        authProvider: FirebotDeviceAuthProvider.botProvider,
                        requestMembershipEvents: true
                    });

                    this._botChatClient.onConnect(() => {
                        resolveIfNotResolved();
                    });

                    this._botChatClient.irc.onRegister(() => this._botChatClient.join(streamer.username));

                    twitchChatListeners.setupBotChatListeners(this._botChatClient);

                    this._botChatClient.connect();

                } else {
                    this._botChatClient = null;
                    resolveIfNotResolved();
                }
            } catch (error) {
                logger.error("Error joining streamers chat channel with Bot account", error);
                resolveIfNotResolved();
            }
        });
    }

    /**
     * Sends the message as the bot if available, otherwise as the streamer.
     * If a username is provided, the message will be whispered.
     * If the message is too long, it will be automatically broken into multiple fragments and sent individually.
     *
     * @param message The message to send
     * @param username If provided, message will be whispered to the given user.
     * @param accountType Which account to chat as. Defaults to bot if available otherwise, the streamer.
     * @param replyToMessageId A message id to reply to
     * @deprecated Use the API wrapper methods ({@linkcode TwitchApi.chat.sendChatMessage()} and {@linkcode TwitchApi.whispers.sendWhisper()}) instead
     */
    async sendChatMessage(
        message: string,
        username?: string,
        accountType?: string,
        replyToMessageId?: string
    ): Promise<void> {
        if (message == null || message?.length < 1) {
            return null;
        }

        const shouldWhisper = username != null && username.trim() !== "";
        let sendAsBot = true;

        const botAvailable = AccountAccess.getAccounts().bot.loggedIn
            && this._botChatClient?.irc?.isConnected === true;

        if (accountType == null) {
            sendAsBot = botAvailable && !shouldWhisper ? true : false;
        } else {
            accountType = accountType.toLowerCase();
            if (accountType === "bot" && !botAvailable) {
                sendAsBot = false;
            }
        }

        if (shouldWhisper) {
            const user = await TwitchApi.users.getUserByName(username);
            await TwitchApi.whispers.sendWhisper(user.id, message, sendAsBot);
        } else {
            await TwitchApi.chat.sendChatMessage(message, replyToMessageId, sendAsBot);
        }
    }
}

const twitchChat = new TwitchChat();

export = twitchChat;