import { HelixChatBadgeSet, HelixCheermoteList } from "@twurple/api";
import {
    EventSubChannelChatMessageEvent,
    EventSubChannelChatNotificationEvent,
    EventSubUserWhisperMessageEvent
} from "@twurple/eventsub-base";
import { EventSubChatMessageCheermote, EventSubChatMessagePart } from "./twurple-private-types";
import { ThirdPartyEmote, ThirdPartyEmoteProvider } from "../../chat/third-party/third-party-emote-provider";
import { FirebotChatMessage, FirebotCheermoteInstance, FirebotParsedMessagePart } from "../../../types/chat";
import { BTTVEmoteProvider } from "../../chat/third-party/bttv";
import { FFZEmoteProvider } from "../../chat/third-party/ffz";
import { SevenTVEmoteProvider } from "../../chat/third-party/7tv";
import logger from "../../logwrapper";
import { SettingsManager } from "../../common/settings-manager";
import accountAccess, { FirebotAccount } from "../../common/account-access";
import twitchApi from "../api";
import frontendCommunicator from "../../common/frontend-communicator";
import utils from "../../utility";

interface ChatBadge {
    title: string;
    url: string;
}

// Yoinked from Twurple
interface HelixEmoteBase {
    id: string;
    name: string;
    getStaticImageUrl(): string;
    getAnimatedImageUrl(): string;
}

class TwitchEventSubChatHelpers {
    // Thanks, IRC
    // eslint-disable-next-line no-control-regex
    private readonly CHAT_ACTION_REGEX = /^[\x01]ACTION (.*)[\x01]$/;

    private readonly URL_REGEX = utils.getNonGlobalUrlRegex();

    private _badgeCache: HelixChatBadgeSet[] = [];

    private _getAllTwitchEmotes = false;
    private _twitchEmotes: {
        streamer: HelixEmoteBase[],
        bot: HelixEmoteBase[]
    } = { streamer: [], bot: [] };

    private _thirdPartyEmotes: ThirdPartyEmote[] = [];
    private _thirdPartyEmoteProviders: ThirdPartyEmoteProvider<unknown, unknown>[] = [
        new BTTVEmoteProvider(),
        new FFZEmoteProvider(),
        new SevenTVEmoteProvider()
    ];

    private _twitchCheermotes: HelixCheermoteList;

    private _profilePicUrlCache: Record<string, string> = {};

    async cacheBadges(): Promise<void> {
        logger.debug("Caching Twitch badges");
        const streamer = accountAccess.getAccounts().streamer;
        const client = twitchApi.streamerClient;
        if (streamer.loggedIn && client) {
            try {
                const channelBadges = await client.chat.getChannelBadges(streamer.userId);
                const globalBadges = await client.chat.getGlobalBadges();

                this._badgeCache = [
                    ...channelBadges,
                    ...globalBadges
                ];
            } catch (error) {
                logger.error("Failed to get channel chat badges", error);
            }
        }
    }

    async cacheTwitchEmotes(): Promise<void> {
        logger.debug("Caching Twitch emotes");

        // Cache this setting so it's consistent during the chat connection
        this._getAllTwitchEmotes = SettingsManager.getSetting("ChatGetAllEmotes") === true;
        const client = twitchApi.streamerClient;

        const { streamer, bot } = accountAccess.getAccounts();

        if (client == null || !streamer.loggedIn) {
            return;
        }

        try {
            let streamerEmotes: HelixEmoteBase[] = [];

            if (this._getAllTwitchEmotes) {
                logger.debug(`Caching all available Twitch emotes for streamer ${streamer.username}`);

                // This includes: global, streamer channel, all channels streamer is subscribed to, etc.
                // This may take SEVERAL calls so it can take several seconds to complete
                streamerEmotes = await twitchApi.chat.getAllUserEmotes();

                if (!streamerEmotes) {
                    return;
                }
            } else {
                logger.debug(`Caching Twitch channel emotes for ${streamer.username}`);
                const channelEmotes = await client.chat.getChannelEmotes(streamer.userId);

                logger.debug("Caching Twitch global emotes");
                const globalEmotes = await client.chat.getGlobalEmotes();

                if (!channelEmotes && !globalEmotes) {
                    return;
                }

                streamerEmotes = [
                    ...channelEmotes,
                    ...globalEmotes
                ];
            }

            this._twitchEmotes.streamer = streamerEmotes;

            if (this._getAllTwitchEmotes) {
                if (bot.loggedIn) {
                    logger.debug(`Caching all available Twitch emotes for bot ${bot.username}`);

                    this._twitchEmotes.bot = await twitchApi.chat.getAllUserEmotes("bot") ?? [];
                } else {
                    logger.debug("Bot account not logged in; Skipping Twitch bot emotes");
                }
            }
        } catch (err) {
            logger.error("Failed to get Twitch chat emotes", err);
            return null;
        }
    }

    async cacheThirdPartyEmotes(): Promise<void> {
        logger.debug("Caching third-party emotes");
        this._thirdPartyEmotes = [];
        for (const provider of this._thirdPartyEmoteProviders) {
            logger.debug(`Caching ${provider.providerName} emotes`);
            this._thirdPartyEmotes.push(...await provider.getAllEmotes());
        }
    }

    async cacheCheermotes(): Promise<void> {
        logger.debug("Caching Twitch cheermotes");
        this._twitchCheermotes = await twitchApi.bits.getChannelCheermotes();
    }

    async onEventSubConnect(): Promise<void> {
        await this.cacheBadges();
        await this.cacheTwitchEmotes();
        await this.cacheThirdPartyEmotes();
        await this.cacheCheermotes();

        // If the all emotes setting is disabled, just send the standard global/channel list for both accounts
        frontendCommunicator.send("all-emotes", {
            streamer: this._mapCachedEmotesForFrontend(this._twitchEmotes.streamer),
            bot: this._mapCachedEmotesForFrontend(this._getAllTwitchEmotes ? this._twitchEmotes.bot : this._twitchEmotes.streamer),
            thirdParty: this._thirdPartyEmotes
        });
    }

    private _mapCachedEmotesForFrontend(emoteList: HelixEmoteBase[]) {
        return emoteList.map(e => ({
            url: e.getStaticImageUrl(),
            animatedUrl: e.getAnimatedImageUrl(),
            origin: "Twitch",
            code: e.name
        }));
    }

    private parseEventSubMessageParts(message: FirebotChatMessage, parts: EventSubChatMessagePart[])
        : FirebotParsedMessagePart[] {
        if (message == null || parts == null) {
            return [];
        }

        const { streamer, bot } = accountAccess.getAccounts();

        return parts.flatMap((p) => {
            if (p.type === "text" && p.text != null) {
                // Check for tagging
                if (message.username !== streamer.username &&
                        (!bot.loggedIn || message.username !== bot.username)) {
                    if (!message.whisper
                        && !message.tagged
                        && streamer.loggedIn
                        && (p.text.includes(streamer.username) || p.text.includes(streamer.displayName))) {
                        message.tagged = true;
                    }
                }

                const subParts: FirebotParsedMessagePart[] = [];
                for (const word of p.text.split(" ")) {
                    // check for links
                    if (this.URL_REGEX.test(word)) {
                        subParts.push({
                            type: "link",
                            text: `${word} `,
                            url: word.startsWith("http") ? word : `https://${word}`
                        });
                        continue;
                    }

                    // check for third party emotes
                    const thirdPartyEmote = this._thirdPartyEmotes.find(e => e.code === word);
                    if (thirdPartyEmote) {
                        subParts.push({
                            type: "third-party-emote",
                            name: thirdPartyEmote.code,
                            origin: thirdPartyEmote.origin,
                            url: thirdPartyEmote.url
                        });
                        continue;
                    }

                    const previous = subParts[subParts.length - 1];
                    if (previous && previous.type === "text") {
                        previous.text += `${word} `;
                    } else {
                        subParts.push({
                            type: "text",
                            text: `${word} `
                        });
                    }
                }

                return subParts;
            }

            const part: FirebotParsedMessagePart = {
                ...p
            };

            if (p.type === "emote") {
                part.origin = "Twitch";

                const emote = this._twitchEmotes.streamer.find(e => e.name === part.name);
                part.url = emote ? emote.getStaticImageUrl() : `https://static-cdn.jtvnw.net/emoticons/v2/${p.emote.id}/default/dark/1.0`;
                part.animatedUrl = emote ? emote.getAnimatedImageUrl() : null;
            }

            if (p.type === "cheermote") {
                const parsedCheermote = this.parseEventSubCheermote(p.cheermote);

                part.animatedUrl = parsedCheermote.animatedUrl;
                part.url = parsedCheermote.url;
                part.color = parsedCheermote.color;
            }

            if (p.type === "mention") {
                // TODO: Add mention part
            }

            return part;
        });
    }

    private parseMessageParts(firebotChatMessage: FirebotChatMessage, parts: EventSubChatMessagePart[] | FirebotParsedMessagePart[]) {
        if (firebotChatMessage == null || parts == null) {
            return [];
        }

        const { streamer, bot } = accountAccess.getAccounts();
        return parts.flatMap((p) => {
            if (p.type === "text" && p.text != null) {

                if (firebotChatMessage.username !== streamer.username &&
                        (!bot.loggedIn || firebotChatMessage.username !== bot.username)) {
                    if (!firebotChatMessage.whisper &&
                        !firebotChatMessage.tagged &&
                        streamer.loggedIn &&
                        (p.text.includes(streamer.username) || p.text.includes(streamer.displayName))) {
                        firebotChatMessage.tagged = true;
                    }
                }

                const subParts: FirebotParsedMessagePart[] = [];
                for (const word of p.text.split(" ")) {
                    // check for links
                    if (this.URL_REGEX.test(word)) {
                        subParts.push({
                            type: "link",
                            text: `${word} `,
                            url: word.startsWith("http") ? word : `https://${word}`
                        });
                        continue;
                    }

                    // check for third party emotes
                    const thirdPartyEmote = this._thirdPartyEmotes.find(e => e.code === word);
                    if (thirdPartyEmote) {
                        subParts.push({
                            type: "third-party-emote",
                            name: thirdPartyEmote.code,
                            origin: thirdPartyEmote.origin,
                            url: thirdPartyEmote.url
                        });
                        continue;
                    }

                    const previous = subParts[subParts.length - 1];
                    if (previous && previous.type === "text") {
                        previous.text += `${word} `;
                    } else {
                        subParts.push({
                            type: "text",
                            text: `${word} `,
                            flagged: p.flagged
                        });
                    }
                }

                // move trailing spaces to separate parts so flagged parts look nicer
                return subParts.flatMap((sp): FirebotParsedMessagePart | FirebotParsedMessagePart[] => {
                    if (sp.type === "text" && sp.flagged && sp.text?.endsWith(" ")) {
                        return [{
                            type: "text",
                            text: sp.text.trimEnd(),
                            flagged: true
                        }, {
                            type: "text",
                            text: " "
                        }];
                    }
                    return sp;
                });
            }

            const part: FirebotParsedMessagePart = {
                ...p
            };

            if (part.type === "emote") {
                part.origin = "Twitch";

                const emote = this._twitchEmotes.streamer.find(e => e.name === part.name);
                part.url = emote ? emote.getStaticImageUrl() : `https://static-cdn.jtvnw.net/emoticons/v2/${part.id}/default/dark/1.0`;
                part.animatedUrl = emote ? emote.getAnimatedImageUrl() : null;
            }

            if (part.type === "cheer") {
                const parsedCheermote = this.parseFirebotCheermote(part);

                part.animatedUrl = parsedCheermote.animatedUrl;
                part.url = parsedCheermote.url;
                part.color = parsedCheermote.color;
            }

            return part;
        });
    }

    private parseCheermote(name: string, amount: number): FirebotCheermoteInstance {
        const displayInfo = this._twitchCheermotes.getCheermoteDisplayInfo(name, amount, {
            background: "light",
            state: "animated",
            scale: "4"
        });

        const staticDisplayInfo = this._twitchCheermotes.getCheermoteDisplayInfo(name, amount, {
            background: "light",
            state: "static",
            scale: "4"
        });

        return {
            name: name,
            amount: amount,
            url: staticDisplayInfo.url,
            animatedUrl: displayInfo.url,
            color: displayInfo.color
        };
    }

    private parseEventSubCheermote(part: EventSubChatMessageCheermote): FirebotCheermoteInstance {
        return this.parseCheermote(part.prefix, part.bits);
    }

    private parseFirebotCheermote(part: FirebotParsedMessagePart): FirebotCheermoteInstance {
        return this.parseCheermote(part.name, part.amount);
    }

    private parseChatBadges(badgeData: Record<string, string>): ChatBadge[] {
        if (this._badgeCache == null) {
            return [];
        }

        const chatBadges = [];

        for (const [setName, version] of Object.entries(badgeData)) {

            const set = this._badgeCache.find(b => b.id === setName);
            if (set == null) {
                continue;
            }

            const setVersion = set.getVersion(version);
            if (setVersion == null) {
                continue;
            }

            try {
                chatBadges.push({
                    title: set.id,
                    url: setVersion.getImageUrl(2)
                });
            } catch (err) {
                logger.debug(`Failed to find badge ${setName} v:${version}`, err);
            }
        }

        return chatBadges;
    }

    private updateAccountAvatar(accountType: "streamer" | "bot", account: FirebotAccount, url: string) {
        account.avatar = url;
        accountAccess.updateAccount(accountType, account, true);
    }

    async getUserProfilePicUrl(userId: string): Promise<string> {
        if (userId == null) {
            return null;
        }

        if (this._profilePicUrlCache[userId]) {
            return this._profilePicUrlCache[userId];
        }

        const streamer = accountAccess.getAccounts().streamer;
        const client = twitchApi.streamerClient;
        if (streamer.loggedIn && client) {
            const user = await twitchApi.users.getUserById(userId);
            if (user) {
                this._profilePicUrlCache[userId] = user.profilePictureUrl;
                return user.profilePictureUrl;
            }
        }

        return null;
    }

    setUserProfilePicUrl(userId: string, url: string, updateAccountAvatars = true) {
        if (userId == null || url == null) {
            return;
        }

        this._profilePicUrlCache[userId] = url;

        if (updateAccountAvatars) {
            if (userId === accountAccess.getAccounts().streamer.userId) {
                this.updateAccountAvatar("streamer", accountAccess.getAccounts().streamer, url);
            } else if (userId === accountAccess.getAccounts().bot.userId) {
                this.updateAccountAvatar("bot", accountAccess.getAccounts().bot, url);
            }
        }
    }

    /**
     * Parses out any control characters from a chat message (like ACTION when /me is used)
     * @param rawText Raw message text
     * @returns Chat message text, stripped of control characters
     */
    private getChatMessage(rawText: string) {
        return this.CHAT_ACTION_REGEX.test(rawText) === true
            ? this.CHAT_ACTION_REGEX.exec(rawText)[0]
            : rawText;
    }

    private async buildBaseFirebotChatMessage(message: EventSubChannelChatMessageEvent | EventSubChannelChatNotificationEvent): Promise<FirebotChatMessage> {
        const { streamer, bot } = accountAccess.getAccounts();

        const isAction = this.CHAT_ACTION_REGEX.test(message.messageText);
        const isSharedChatMessage = message.sourceMessageId != null
            && message.sourceBroadcasterId !== accountAccess.getAccounts().streamer.userId;

        const firebotChatMessage: FirebotChatMessage = {
            id: message.messageId,
            username: message.chatterName,
            userId: message.chatterId,
            userDisplayName: message.chatterDisplayName,
            rawText: isAction ? this.getChatMessage(message.messageText) : message.messageText,
            color: message.color,
            badges: this.parseChatBadges(message.badges),
            parts: [],
            roles: [],
            profilePicUrl: await this.getUserProfilePicUrl(message.chatterId),

            // Flags
            tagged: false,
            action: isAction,
            isAnnouncement: false,

            // Whispers have a separate event
            whisper: false,

            // Shared Chat
            isSharedChatMessage,
            sharedChatRoomId: message.sourceBroadcasterId,

            // NOTE: EventSub does not currently return this data
            isExtension: false,
            isFirstChat: false,
            isReturningChatter: false,
            isRaider: false,
            raidingFrom: "",
            isSuspiciousUser: false
        };

        const messageParts = this.parseEventSubMessageParts(firebotChatMessage, message.messageParts);
        firebotChatMessage.parts = messageParts;

        if (streamer.loggedIn && firebotChatMessage.username === streamer.username) {
            firebotChatMessage.isBroadcaster = true;
            firebotChatMessage.roles.push("broadcaster");
        }

        if (bot.loggedIn && firebotChatMessage.username === bot.username) {
            firebotChatMessage.isBot = true;
            firebotChatMessage.roles.push("bot");
        }

        if (firebotChatMessage.isFounder) {
            firebotChatMessage.roles.push("founder");
            firebotChatMessage.roles.push("sub");
        } else if (firebotChatMessage.isSubscriber) {
            firebotChatMessage.roles.push("sub");
        }

        if (firebotChatMessage.isMod) {
            firebotChatMessage.roles.push("mod");
        }

        if (firebotChatMessage.isVip) {
            firebotChatMessage.roles.push("vip");
        }

        return firebotChatMessage;
    }

    async buildFirebotChatMessageFromEventSubChatMessage(message: EventSubChannelChatMessageEvent): Promise<FirebotChatMessage> {
        const firebotChatMessage = await this.buildBaseFirebotChatMessage(message);

        firebotChatMessage.customRewardId = message.rewardId;

        firebotChatMessage.isCheer = message.isCheer;
        firebotChatMessage.isHighlighted = message.messageType === "channel_points_highlighted";

        // Replies
        firebotChatMessage.isReply = message.parentMessageId != null;
        firebotChatMessage.replyParentMessageId = message.parentMessageId;
        firebotChatMessage.replyParentMessageText = message.parentMessageText;
        firebotChatMessage.replyParentMessageSenderUserId = message.parentMessageUserId;
        firebotChatMessage.replyParentMessageSenderDisplayName = message.parentMessageUserDisplayName;
        firebotChatMessage.threadParentMessageId = message.threadMessageId;
        firebotChatMessage.threadParentMessageSenderUserId = message.threadMessageUserId;
        firebotChatMessage.threadParentMessageSenderDisplayName = message.threadMessageUserDisplayName;

        if (firebotChatMessage.isReply) {
            const replyUsername = message.parentMessageUserName;
            if (firebotChatMessage.replyParentMessageText.startsWith(`@${replyUsername}`)) {
                firebotChatMessage.replyParentMessageText = firebotChatMessage.replyParentMessageText.substring(replyUsername.length + 1);
            }

            const firstPart = firebotChatMessage.parts[0] ?? {} as Partial<FirebotParsedMessagePart>;
            if (firstPart.type === "text" && firstPart.text.startsWith('@')) {
                firstPart.text = firstPart.text.split(" ").slice(1).join(" ");

                if (firstPart.text.trim() === "") {
                    firebotChatMessage.parts.splice(0, 1);
                }
            }
        }

        return firebotChatMessage;
    }

    async buildFirebotChatMessageFromEventSubWhisper(message: EventSubUserWhisperMessageEvent): Promise<FirebotChatMessage> {
        const isAction = this.CHAT_ACTION_REGEX.test(message.messageText);

        const firebotChatMessage: FirebotChatMessage = {
            id: null,
            username: message.senderUserName,
            userId: message.senderUserId,
            userDisplayName: message.senderUserDisplayName,
            rawText: isAction ? this.getChatMessage(message.messageText) : message.messageText,
            badges: [],
            parts: [],
            roles: [],
            profilePicUrl: await this.getUserProfilePicUrl(message.senderUserId),

            // Flags
            tagged: false,
            action: isAction,
            isAnnouncement: false,
            isSharedChatMessage: false,

            // Whispers have a separate event
            whisper: true,
            whisperTarget: message.userName,

            // NOTE: EventSub does not currently return this data
            isExtension: false,
            isFirstChat: false,
            isReturningChatter: false,
            isRaider: false,
            raidingFrom: "",
            isSuspiciousUser: false
        };

        // TODO: Figure out whisper parts
        //const messageParts = this.parseMessageParts(firebotChatMessage, message.messageParts);
        //firebotChatMessage.parts = messageParts;

        return firebotChatMessage;
    }
}

const chatHelpers = new TwitchEventSubChatHelpers();

export = chatHelpers;