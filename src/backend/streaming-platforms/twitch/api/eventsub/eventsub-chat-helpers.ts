import type {
    HelixChatBadgeSet,
    HelixCheermoteList,
    HelixEmoteFormat,
    HelixEmoteScale,
    HelixEmoteThemeMode
} from "@twurple/api";
import {
    type EventSubAutoModMessageHoldV2Event,
    type EventSubChannelChatNotificationEvent,
    type EventSubUserWhisperMessageEvent,
    EventSubChannelChatAnnouncementNotificationEvent,
    EventSubChannelChatMessageEvent
} from "@twurple/eventsub-base";
import type {
    EventSubChatMessageCheermote,
    EventSubChatMessageCheermotePart,
    EventSubChatMessageEmotePart,
    EventSubChatMessageMentionPart,
    EventSubChatMessagePart
} from "../twurple-private-types";

import type {
    FirebotChatMessage,
    FirebotChatMessageCheermotePart,
    FirebotChatMessageEmotePart,
    FirebotChatMessageMentionPart,
    FirebotChatMessagePart,
    FirebotChatMessageTextPart,
    FirebotCheermoteInstance,
    FirebotParsedMessagePart
} from "../../../../../types/chat";
import type { FirebotAccount } from "../../../../../types/accounts";

import { AccountAccess } from "../../../../common/account-access";
import { SettingsManager } from "../../../../common/settings-manager";
import { TwitchApi } from "../";
import viewerDatabase from "../../../../viewers/viewer-database";
import frontendCommunicator from "../../../../common/frontend-communicator";
import logger from "../../../../logwrapper";
import { getUrlRegex } from "../../../../utils";

import { ThirdPartyEmote, ThirdPartyEmoteProvider } from "../../../../chat/third-party/third-party-emote-provider";
import { BTTVEmoteProvider } from "../../../../chat/third-party/bttv";
import { FFZEmoteProvider } from "../../../../chat/third-party/ffz";
import { SevenTVEmoteProvider } from "../../../../chat/third-party/7tv";

interface ChatBadge {
    title: string;
    url: string;
}

// Yoinked from Twurple
interface HelixEmoteBase {
    id: string;
    name: string;
    getStaticImageUrl(scale?: HelixEmoteScale): string;
    getAnimatedImageUrl(scale?: HelixEmoteScale): string;
}

class TwitchEventSubChatHelpers {
    // Thanks, IRC
    // eslint-disable-next-line no-control-regex
    private readonly CHAT_ACTION_REGEX = /^[\x01]ACTION (.*)[\x01]$/;
    private readonly URL_REGEX = getUrlRegex(false);

    readonly HIGHLIGHT_MESSAGE_REWARD_ID = "highlight-message";

    private _badgeCache: HelixChatBadgeSet[] = [];

    private _getAllTwitchEmotes = false;
    private _twitchEmotes: {
        streamer: HelixEmoteBase[];
        bot: HelixEmoteBase[];
    } = { streamer: [], bot: [] };

    private _thirdPartyEmotes: ThirdPartyEmote[] = [];
    private _thirdPartyEmoteProviders: ThirdPartyEmoteProvider<unknown, unknown>[] = [
        new BTTVEmoteProvider(),
        new FFZEmoteProvider(),
        new SevenTVEmoteProvider()
    ];

    private _twitchCheermotes: HelixCheermoteList;

    private _profilePicUrlCache: Record<string, string> = {};

    constructor() {
        AccountAccess.on("account-update",
            (cache) => {
                if (cache.streamer?.loggedIn) {
                    this.setUserProfilePicUrl(
                        cache.streamer.userId,
                        cache.streamer.avatar,
                        false
                    );
                }

                if (cache.bot?.loggedIn) {
                    this.setUserProfilePicUrl(
                        cache.bot.userId,
                        cache.bot.avatar,
                        false
                    );
                }
            }
        );

        viewerDatabase.on("updated-viewer-avatar",
            ({ userId, url }) => {
                this.setUserProfilePicUrl(userId, url);
            }
        );
    }

    async cacheBadges(): Promise<void> {
        logger.debug("Caching Twitch badges");
        const streamer = AccountAccess.getAccounts().streamer;
        const client = TwitchApi.streamerClient;
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
        const client = TwitchApi.streamerClient;

        const { streamer, bot } = AccountAccess.getAccounts();

        if (client == null || !streamer.loggedIn) {
            return;
        }

        try {
            let streamerEmotes: HelixEmoteBase[] = [];

            if (this._getAllTwitchEmotes) {
                logger.debug(`Caching all available Twitch emotes for streamer ${streamer.username}`);

                // This includes: global, streamer channel, all channels streamer is subscribed to, etc.
                // This may take SEVERAL calls so it can take several seconds to complete
                streamerEmotes = await TwitchApi.chat.getAllUserEmotes();

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

                    this._twitchEmotes.bot = await TwitchApi.chat.getAllUserEmotes("bot") ?? [];
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
        this._twitchCheermotes = await TwitchApi.bits.getChannelCheermotes();
    }

    async cacheChatAssets(): Promise<void> {
        await this.cacheBadges();
        await this.cacheCheermotes();
        await this.cacheThirdPartyEmotes();
        await this.cacheTwitchEmotes();

        // If the all emotes setting is disabled, just send the standard global/channel list for both accounts
        frontendCommunicator.send("all-emotes", {
            streamer: this._mapCachedEmotesForFrontend(this._twitchEmotes.streamer),
            bot: this._mapCachedEmotesForFrontend(this._getAllTwitchEmotes ? this._twitchEmotes.bot : this._twitchEmotes.streamer),
            thirdParty: this._thirdPartyEmotes
        });
    }

    private _mapCachedEmotesForFrontend(emoteList: HelixEmoteBase[]) {
        return emoteList.map(e => ({
            url: e.getStaticImageUrl("3.0"),
            animatedUrl: e.getAnimatedImageUrl("3.0"),
            origin: "Twitch",
            code: e.name
        }));
    }

    private getEmoteUrl(
        part: EventSubChatMessageEmotePart,
        format: HelixEmoteFormat = "static",
        themeMode: HelixEmoteThemeMode = "dark",
        scale: HelixEmoteScale = "3.0"
    ): string {
        return `https://static-cdn.jtvnw.net/emoticons/v2/${part.emote.id}/${format}/${themeMode}/${scale}`;
    }

    private accountTaggedInText(text: string, account: FirebotAccount): boolean {
        return account.loggedIn === true
            && (text.includes(account.username) || text.includes(account.displayName));
    }

    private parseMessageParts(
        message: FirebotChatMessage,
        parts: EventSubChatMessagePart[] | FirebotParsedMessagePart[]
    ) : FirebotChatMessagePart[] {
        if (message == null || parts == null) {
            return [];
        }

        const { streamer, bot } = AccountAccess.getAccounts();

        return parts.flatMap((p: EventSubChatMessagePart | FirebotChatMessagePart) => {
            if (p.type === "text" && p.text != null) {
                // Check for tagging
                if (message.username !== streamer.username &&
                        (!bot.loggedIn || message.username !== bot.username)
                ) {
                    if (!message.whisper
                        && !message.tagged
                        && (this.accountTaggedInText(p.text, streamer)
                            || this.accountTaggedInText(p.text, bot))
                    ) {
                        message.tagged = true;
                    }
                }

                // Leave flagged text as their own separate parts
                if ((p as FirebotChatMessageTextPart).flagged !== true) {
                    const subParts: FirebotChatMessagePart[] = [];
                    for (const word of p.text.split(" ")) {
                        const previous = subParts[subParts.length - 1];

                        // check for links
                        if (this.URL_REGEX.test(word)) {
                            if (previous) {
                                if (previous.type === "text") {
                                    previous.text += " ";
                                } else {
                                    subParts.push({
                                        type: "text",
                                        text: " "
                                    });
                                }
                            }

                            subParts.push({
                                type: "link",
                                text: word,
                                url: word.startsWith("http") ? word : `https://${word}`
                            });
                            continue;
                        }

                        // check for third party emotes
                        const thirdPartyEmote = this._thirdPartyEmotes.find(e => e.code === word);
                        if (thirdPartyEmote) {
                            if (previous) {
                                if (previous.type === "text") {
                                    previous.text += " ";
                                } else {
                                    subParts.push({
                                        type: "text",
                                        text: " "
                                    });
                                }
                            }

                            subParts.push({
                                type: "third-party-emote",
                                text: thirdPartyEmote.code,
                                name: thirdPartyEmote.code,
                                origin: thirdPartyEmote.origin,
                                url: thirdPartyEmote.url
                            });
                            continue;
                        }

                        if (previous) {
                            if (previous.type === "text") {
                                previous.text += ` ${word}`;
                            } else {
                                subParts.push({
                                    type: "text",
                                    text: ` ${word}`
                                });
                            }
                        } else {
                            subParts.push({
                                type: "text",
                                text: word
                            });
                        }
                    }

                    return subParts;
                }
            }

            const part = { ...p } as FirebotChatMessagePart;

            switch (part.type) {
                case "emote":
                    this.parseEventSubEmote(
                        part,
                        p as EventSubChatMessageEmotePart
                    );
                    break;

                case "cheermote":
                    this.parseEventSubCheermote(
                        part,
                        (p as EventSubChatMessageCheermotePart).cheermote
                    );
                    break;

                case "mention":
                    this.parseEventSubMention(
                        part,
                        (p as EventSubChatMessageMentionPart)
                    );
                    break;
            }

            return part;
        });
    }

    private parseEmote(emotePart: EventSubChatMessageEmotePart)
        : FirebotChatMessageEmotePart {
        return {
            type: "emote",
            origin: "Twitch",
            text: emotePart.text,
            name: emotePart.text,
            url: this.getEmoteUrl(emotePart),
            animatedUrl: emotePart.emote.format.includes("animated")
                ? this.getEmoteUrl(emotePart, "animated")
                : null
        };
    }

    private parseEventSubEmote(
        part: FirebotChatMessageEmotePart,
        emotePart: EventSubChatMessageEmotePart
    ): void {
        const parsedEmote = this.parseEmote(emotePart);
        part.origin = parsedEmote.origin;
        part.text = parsedEmote.text;
        part.name = parsedEmote.name;
        part.url = parsedEmote.url;
        part.animatedUrl = parsedEmote.animatedUrl;
    }

    private parseCheermote(name: string, amount: number)
        : FirebotChatMessageCheermotePart {
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
            type: "cheermote",
            text: `${name}${amount}`,
            name: name,
            amount: amount,
            url: staticDisplayInfo.url,
            animatedUrl: displayInfo.url,
            color: displayInfo.color
        };
    }

    private parseEventSubCheermote(
        part: FirebotChatMessageCheermotePart,
        cheermote: EventSubChatMessageCheermote
    ): void {
        const parsedCheermote = this.parseCheermote(cheermote.prefix, cheermote.bits);
        part.name = parsedCheermote.name;
        part.url = parsedCheermote.url;
        part.animatedUrl = parsedCheermote.animatedUrl;
        part.amount = parsedCheermote.amount;
        part.color = parsedCheermote.color;
    }

    private parseFirebotCheermote(part: FirebotParsedMessagePart): FirebotCheermoteInstance {
        return this.parseCheermote(part.name, part.amount);
    }

    private parseEventSubMention(
        part: FirebotChatMessageMentionPart,
        mentionPart: EventSubChatMessageMentionPart
    ): void {
        part.username = mentionPart.mention.user_login;
        part.userId = mentionPart.mention.user_id;
        part.userDisplayName = mentionPart.mention.user_name;
    }

    private parseChatBadges(badgeData: Record<string, string>): ChatBadge[] {
        if (this._badgeCache == null) {
            return [];
        }

        const chatBadges: ChatBadge[] = [];

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

    private updateAccountAvatar(
        accountType: "streamer" | "bot",
        account: FirebotAccount,
        url: string
    ): void {
        account.avatar = url;
        AccountAccess.updateAccount(accountType, account, false);
    }

    async getUserProfilePicUrl(userId: string): Promise<string> {
        if (userId == null) {
            return null;
        }

        if (this._profilePicUrlCache[userId]) {
            return this._profilePicUrlCache[userId];
        }

        const streamer = AccountAccess.getAccounts().streamer;
        const client = TwitchApi.streamerClient;
        if (streamer.loggedIn && client) {
            const user = await TwitchApi.users.getUserById(userId);
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
            if (userId === AccountAccess.getAccounts().streamer.userId) {
                this.updateAccountAvatar("streamer", AccountAccess.getAccounts().streamer, url);
            } else if (userId === AccountAccess.getAccounts().bot.userId) {
                this.updateAccountAvatar("bot", AccountAccess.getAccounts().bot, url);
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

    private async buildBaseChatMessage(
        event:
            | EventSubChannelChatMessageEvent
            | EventSubChannelChatNotificationEvent
    ): Promise<FirebotChatMessage> {
        const { streamer, bot } = AccountAccess.getAccounts();

        const isAction = this.CHAT_ACTION_REGEX.test(event.messageText);
        const isSharedChatMessage = event.sourceMessageId != null
            && event.sourceBroadcasterId !== AccountAccess.getAccounts().streamer.userId;

        let isAnnouncement = false;
        let announcementColor = undefined;
        let chatColor = event.color;
        if (event instanceof EventSubChannelChatAnnouncementNotificationEvent) {
            isAnnouncement = true;
            announcementColor = event.color;

            // FIX: See https://github.com/twurple/twurple/issues/646
            const userColor = await TwitchApi.streamerClient.chat.getColorForUser(event.chatterId);
            chatColor = userColor ?? chatColor;
        }

        const chatMessage: FirebotChatMessage = {
            id: event.messageId,
            username: event.chatterName,
            userId: event.chatterId,
            userDisplayName: event.chatterDisplayName,
            rawText: isAction ? this.getChatMessage(event.messageText) : event.messageText,
            color: chatColor,
            badges: this.parseChatBadges(event.badges),
            parts: [],
            roles: [],
            profilePicUrl: await this.getUserProfilePicUrl(event.chatterId),

            // Flags
            tagged: false,
            action: isAction,
            isAnnouncement,
            // eslint-disable-next-line
            announcementColor: announcementColor ? announcementColor.toUpperCase() : undefined,
            isCheer: false,
            isReply: false,
            isHiddenFromChatFeed: false,
            isHighlighted: false,

            // Whispers have a separate event
            whisper: false,

            // Shared Chat
            isSharedChatMessage,
            sharedChatRoomId: event.sourceBroadcasterId,

            // NOTE: EventSub does not currently return this data
            isExtension: false,
            isFirstChat: false,
            isReturningChatter: false,
            isRaider: false,
            raidingFrom: "",
            isSuspiciousUser: false
        };

        const messageParts = this.parseMessageParts(chatMessage, event.messageParts);
        chatMessage.parts = messageParts;

        chatMessage.isFounder = chatMessage.badges.some(b => b.title === "founder");
        chatMessage.isMod = chatMessage.badges.some(b => b.title === "moderator");
        chatMessage.isVip = chatMessage.badges.some(b => b.title === "vip");
        chatMessage.isSubscriber = chatMessage.isFounder ||
            chatMessage.badges.some(b => b.title === "subscriber");

        if (streamer.loggedIn && chatMessage.userId === streamer.userId) {
            chatMessage.isBroadcaster = true;
            chatMessage.roles.push("broadcaster");
        }

        if (bot.loggedIn && chatMessage.userId === bot.userId) {
            chatMessage.isBot = true;
            chatMessage.roles.push("bot");
        }

        if (chatMessage.isFounder) {
            chatMessage.roles.push("founder");
            chatMessage.roles.push("sub");
        } else if (chatMessage.isSubscriber) {
            chatMessage.roles.push("sub");
        }

        if (chatMessage.isMod) {
            chatMessage.roles.push("mod");
        }

        if (chatMessage.isVip) {
            chatMessage.roles.push("vip");
        }

        return chatMessage;
    }

    async buildChatMessageFromChatEvent(
        event: EventSubChannelChatMessageEvent | EventSubChannelChatNotificationEvent
    ): Promise<FirebotChatMessage> {
        const chatMessage = await this.buildBaseChatMessage(event);

        if (event instanceof EventSubChannelChatMessageEvent) {
            chatMessage.customRewardId = event.rewardId;

            chatMessage.isCheer = event.isCheer;
            chatMessage.isHighlighted = event.messageType === "channel_points_highlighted";

            // Replies
            chatMessage.isReply = event.parentMessageId != null;
            chatMessage.replyParentMessageId = event.parentMessageId;
            chatMessage.replyParentMessageText = event.parentMessageText;
            chatMessage.replyParentMessageSenderUserId = event.parentMessageUserId;
            chatMessage.replyParentMessageSenderDisplayName = event.parentMessageUserDisplayName;
            chatMessage.threadParentMessageId = event.threadMessageId;
            chatMessage.threadParentMessageSenderUserId = event.threadMessageUserId;
            chatMessage.threadParentMessageSenderDisplayName = event.threadMessageUserDisplayName;

            if (chatMessage.isReply) {
                const replyUsername = event.parentMessageUserName;
                if (chatMessage.replyParentMessageText.startsWith(`@${replyUsername}`)) {
                    chatMessage.replyParentMessageText = chatMessage.replyParentMessageText.substring(replyUsername.length + 1);
                }

                const firstPart = chatMessage.parts[0] ?? {} as FirebotChatMessagePart;
                if (firstPart.type === "text" && firstPart.text.startsWith("@")) {
                    firstPart.text = firstPart.text.split(" ").slice(1).join(" ");

                    if (firstPart.text.trim() === "") {
                        chatMessage.parts.splice(0, 1);
                    }
                }
            }
        }

        return chatMessage;
    }

    async buildFirebotChatMessageFromWhisper(message: EventSubUserWhisperMessageEvent): Promise<FirebotChatMessage> {
        const isAction = this.CHAT_ACTION_REGEX.test(message.messageText);

        const chatMessage: FirebotChatMessage = {
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
        //const messageParts = this.parseMessageParts(chatMessage, message.messageParts);
        //chatMessage.parts = messageParts;

        return chatMessage;
    }

    async buildChatMessageFromAutoModEvent(event: EventSubAutoModMessageHoldV2Event) {
        const profilePicUrl = await this.getUserProfilePicUrl(event.userId);

        const chatMessage: FirebotChatMessage = {
            id: event.messageId,
            username: event.userName,
            userId: event.userId,
            userDisplayName: event.userDisplayName,
            rawText: event.messageText,
            profilePicUrl: profilePicUrl,
            whisper: false,
            action: false,
            tagged: false,
            isBroadcaster: false,
            badges: [],
            parts: [],
            roles: [],
            isAutoModHeld: true,
            autoModStatus: "pending",
            autoModReason: (event.reason === "automod" ? event.autoMod?.category : event.reason === "blocked_term" ? "blocked term" : null) ?? "unknown",
            isSharedChatMessage: false
        };

        const { streamer, bot } = AccountAccess.getAccounts();
        if (this.accountTaggedInText(event.messageText, streamer)
            || this.accountTaggedInText(event.messageText, bot)
        ) {
            chatMessage.tagged = true;
        }

        const flaggedPhrases = event.reason === "automod"
            ? event.autoMod?.boundaries?.map(b => b.text) ?? []
            : event.blockedTerms?.map(b => b.text) ?? [];

        const flaggedPhrasesRegex = new RegExp(`(${flaggedPhrases.join("|")})`, "g");

        const parts = this.parseMessageParts(
            chatMessage,
            event.messageParts.flatMap((f): FirebotParsedMessagePart | FirebotParsedMessagePart[] => {
                switch (f.type) {
                    case "text":
                    {
                        const splitText = f.text?.split(flaggedPhrasesRegex)
                        // sometimes we get empty strings in the split
                            .filter(t => t.length > 0);

                        return splitText.map((text) => {
                            const isFlagged = flaggedPhrases.some(phrase => text.includes(phrase));
                            return {
                                type: "text",
                                text: text,
                                flagged: isFlagged
                            };
                        });
                    }

                    case "emote":
                    case "cheermote":
                        return f;
                }
            }));

        chatMessage.parts = parts;

        return chatMessage;
    }
}

const chatHelpers = new TwitchEventSubChatHelpers();

export = chatHelpers;