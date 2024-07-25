import { ChatItem, ChatProvider, MessagePart } from "firebot-types";
import { ChatClient, parseChatMessage } from "@twurple/chat";

import { twitchAccountAuthProvider } from "./twitch-auth";

export class TwitchChat extends ChatProvider<{
  connected: () => void;
  disconnected: () => void;
}> {
  private streamerClient: ChatClient | null = null;
  private botClient: ChatClient | null = null;

  private connectionPromiseResolve:
    | ((value: boolean | PromiseLike<boolean>) => void)
    | null = null;

  constructor() {
    super();
  }

  async connect(): Promise<boolean> {
    console.log("connecting to twitch chat");
    await this.disconnect(false);

    const streamerAuthProvider = twitchAccountAuthProvider.streamerProvider;
    const streamerAccount = twitchAccountAuthProvider.streamerAccount;

    if (streamerAuthProvider == null || streamerAccount == null) {
      console.log("Streamer account not set up");
      return false;
    }

    this.streamerClient = new ChatClient({
      authProvider: streamerAuthProvider,
      requestMembershipEvents: true,
    });

    this.streamerClient.irc.onRegister(() => {
      this.streamerClient?.join(streamerAccount.username);
    });

    const connectionPromise = new Promise<boolean>((resolve) => {
      this.connectionPromiseResolve = resolve;
    });

    this.streamerClient?.irc.onPasswordError((event) => {
      console.log("Password error", event);
      if (this.connectionPromiseResolve) {
        this.connectionPromiseResolve(false);
        this.connectionPromiseResolve = null;
      }
      this.disconnect(true);
    });

    this.streamerClient?.irc.onConnect(() => {
      console.log("twitch chat connected!!");
      if (this.connectionPromiseResolve) {
        this.connectionPromiseResolve(true);
        this.connectionPromiseResolve = null;
      }
      this.emit("connected");
    });

    this.streamerClient?.irc.onDisconnect((manual, reason) => {
      if (!manual) {
        console.log("twitch chat disconnected unexpectedly", reason);
      }
    });

    this.streamerClient?.onMessage(async (channel, user, message, msg) => {
      const parsedParts: MessagePart[] = parseChatMessage(
        message,
        msg.emoteOffsets,
        []
      ).map((twurpleChatPart) => {
        if (twurpleChatPart.type === "emote") {
          return {
            type: "emote",
            id: twurpleChatPart.id,
            name: twurpleChatPart.name,
            url: `https://static-cdn.jtvnw.net/emoticons/v1/${twurpleChatPart.id}/1.0`,
          };
        } else if (twurpleChatPart.type === "cheer") {
          return {
            type: "text",
            text: `cheer${twurpleChatPart.amount}`,
          };
        } else {
          return {
            type: "text",
            text: twurpleChatPart.text,
          };
        }
      });
      const chatItem: ChatItem = {
        type: "message",
        platformId: "twitch",
        chatMessage: {
          id: msg.id,
          parts: parsedParts,
          avatarUrl: "",
          badges: [],
          user: {
            id: msg.userInfo.userId,
            username: msg.userInfo.userName,
            displayName: msg.userInfo.displayName,
            roles: [],
          },
          rawText: message,
          whisper: false,
          metadata: {},
        },
      };
      this.emit("chatItem", chatItem);
    });

    this.streamerClient?.connect();

    const botAuthProvider = twitchAccountAuthProvider.botProvider;
    if (botAuthProvider) {
      this.botClient = new ChatClient({
        authProvider: botAuthProvider,
        requestMembershipEvents: true,
      });

      this.botClient.irc.onRegister(() => {
        this.botClient?.join(streamerAccount!.username);
      });
    } else {
      this.botClient = null;
    }

    return connectionPromise;
  }

  async disconnect(emitDisconnectEvent = true): Promise<void> {
    if (this.streamerClient != null) {
      this.streamerClient.quit();
      this.streamerClient = null;
    }
    if (this.botClient != null && this.botClient?.irc?.isConnected === true) {
      this.botClient.quit();
      this.botClient = null;
    }
    if (emitDisconnectEvent) {
      this.emit("disconnected");
    }
    console.log("twitch chat disconnected");
  }

  get connected() {
    return this.streamerClient?.isConnected ?? false;
  }
}
