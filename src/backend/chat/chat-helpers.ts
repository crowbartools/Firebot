import { HelixChatBadgeSet, HelixCheermoteList, HelixEmoteScale } from "@twurple/api";
import { ChatMessage, ParsedMessageCheerPart, ParsedMessagePart, findCheermotePositions, parseChatMessage } from "@twurple/chat";
import { EventSubAutoModMessageHoldV2Event } from "@twurple/eventsub-base";

import {
    FirebotChatMessage,
    FirebotCheermoteInstance,
    FirebotParsedMessagePart
} from "../../types/chat";
import { FirebotAccount } from "../../types/accounts";

import { AccountAccess } from "../common/account-access";
import { SettingsManager } from "../common/settings-manager";
import { SharedChatCache } from "../streaming-platforms/twitch/chat/shared-chat-cache";
import { TwitchApi } from "../streaming-platforms/twitch/api";
import rankManager from "../ranks/rank-manager";
import roleManager from "../roles/custom-roles-manager";
import viewerDatabase from "../viewers/viewer-database";
import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";
import { getUrlRegex } from "../utils";

import { ThirdPartyEmote, ThirdPartyEmoteProvider } from "./third-party/third-party-emote-provider";
import { BTTVEmoteProvider } from "./third-party/bttv";
import { FFZEmoteProvider } from "./third-party/ffz";
import { SevenTVEmoteProvider } from "./third-party/7tv";

interface ExtensionBadge {
    id: string;
    version: string;
}

// Yoinked from Twurple
interface HelixEmoteBase {
    id: string;
    name: string;
    getStaticImageUrl(scale?: HelixEmoteScale): string;
    getAnimatedImageUrl(scale?: HelixEmoteScale): string;
}

class FirebotChatHelpers {
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

    private readonly URL_REGEX = getUrlRegex(false);

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

    async cacheThirdPartyEmotes() {
        logger.debug("Caching third-party emotes");
        this._thirdPartyEmotes = [];
        for (const provider of this._thirdPartyEmoteProviders) {
            logger.debug(`Caching ${provider.providerName} emotes`);
            this._thirdPartyEmotes.push(...await provider.getAllEmotes());
        }
    }

    async cacheCheermotes() {
        logger.debug("Caching Twitch cheermotes");
        this._twitchCheermotes = await TwitchApi.bits.getChannelCheermotes();
    }

    parseCheermote(part: ParsedMessageCheerPart | FirebotParsedMessagePart): FirebotCheermoteInstance {
        const displayInfo = this._twitchCheermotes.getCheermoteDisplayInfo(part.name, part.amount, {
            background: "light",
            state: "animated",
            scale: "4"
        });

        const staticDisplayInfo = this._twitchCheermotes.getCheermoteDisplayInfo(part.name, part.amount, {
            background: "light",
            state: "static",
            scale: "4"
        });

        return {
            name: part.name,
            amount: part.amount,
            url: staticDisplayInfo.url,
            animatedUrl: displayInfo.url,
            color: displayInfo.color
        };
    }

    async getCheermoteData(message: string): Promise<FirebotCheermoteInstance[]> {
        const cheermotes: FirebotCheermoteInstance[] = [];
        if (!(message?.length > 0)) {
            return cheermotes;
        }

        const parsedCheermotes = findCheermotePositions(message, this._twitchCheermotes.getPossibleNames());

        return parsedCheermotes.map(this.parseCheermote);
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

    private _updateAccountAvatar(
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
                this._updateAccountAvatar("streamer", AccountAccess.getAccounts().streamer, url);
            } else if (userId === AccountAccess.getAccounts().bot.userId) {
                this._updateAccountAvatar("bot", AccountAccess.getAccounts().bot, url);
            }
        }
    }

    private _parseMessageParts(firebotChatMessage: FirebotChatMessage, parts: ParsedMessagePart[] | FirebotParsedMessagePart[]) {
        if (firebotChatMessage == null || parts == null) {
            return [];
        }
        const { streamer, bot } = AccountAccess.getAccounts();
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

                let emote = this._twitchEmotes.streamer.find(e => e.name === part.name);
                if (emote == null) {
                    emote = this._twitchEmotes.bot.find(e => e.name === part.name);
                }

                part.url = emote ? emote.getStaticImageUrl("3.0") : `https://static-cdn.jtvnw.net/emoticons/v2/${part.id}/default/dark/3.0`;
                part.animatedUrl = emote ? emote.getAnimatedImageUrl("3.0") : null;
            }

            if (part.type === "cheer") {
                const parsedCheermote = this.parseCheermote(part);

                part.animatedUrl = parsedCheermote.animatedUrl;
                part.url = parsedCheermote.url;
                part.color = parsedCheermote.color;
            }

            return part;
        });
    }

    private _getChatBadges(badges: Map<string, string>) {
        if (this._badgeCache == null) {
            return [];
        }

        const chatBadges = [];

        for (const [setName, version] of badges.entries()) {

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

    private _getMessageParts(text: string): FirebotParsedMessagePart[] {
        if (!this._twitchEmotes) {
            const part: FirebotParsedMessagePart = {
                type: "text",
                text: text
            };
            return [part];
        }

        const words = text.split(" ");
        return words.map((word) => {
            let emoteId = null;
            let url = "";
            let animatedUrl = "";
            try {
                const foundEmote = Object.values(this._twitchEmotes || {})
                    .flat()
                    .find(e => e.name === word);
                if (foundEmote) {
                    emoteId = foundEmote.id;
                    url = foundEmote.getStaticImageUrl("3.0");
                    animatedUrl = foundEmote.getAnimatedImageUrl("3.0");
                }
            } catch (err) {
                //logger.silly(`Failed to find emote id for ${word}`, err);
            }

            let part: FirebotParsedMessagePart;
            if (emoteId != null) {
                part = {
                    type: "emote",
                    url: url,
                    animatedUrl: animatedUrl,
                    id: emoteId,
                    name: word
                };
            } else {
                part = {
                    type: "text",
                    text: `${word} `
                };
            }
            return part;
        });
    }

    buildBasicFirebotChatMessage(msgText: string, username: string): FirebotChatMessage {
        return {
            id: null,
            username: username,
            userId: null,
            rawText: msgText,
            whisper: false,
            action: false,
            tagged: false,
            badges: [],
            parts: [],
            roles: [],
            isSharedChatMessage: false
        };
    }

    async buildFirebotChatMessage(msg: ChatMessage, msgText: string, whisper = false, action = false) {
        const sharedChatRoomId = msg.tags.get("source-room-id");
        const sharedChatRoom = SharedChatCache.participants[sharedChatRoomId];
        const isSharedChatMessage = sharedChatRoomId != null && sharedChatRoomId !== AccountAccess.getAccounts().streamer.userId;
        const isGigantified = msg.tags.get("msg-id") === "gigantified-emote-message";
        const firebotChatMessage: FirebotChatMessage = {
            id: msg.tags.get("id"),
            username: msg.userInfo.userName,
            userId: msg.userInfo.userId,
            userDisplayName: msg.userInfo.displayName,
            customRewardId: msg.tags.get("custom-reward-id") || undefined,
            isHighlighted: msg.tags.get("msg-id") === "highlighted-message",
            isAnnouncement: false,
            isHiddenFromChatFeed: false,
            isFirstChat: msg.isFirst ?? false,
            isReturningChatter: msg.isReturningChatter ?? false,
            isReply: msg.tags.has("reply-parent-msg-id"),
            isGigantified: isGigantified,
            replyParentMessageId: msg.tags.get("reply-parent-msg-id"),
            replyParentMessageText: msg.tags.get("reply-parent-msg-body"),
            replyParentMessageSenderUserId: msg.tags.get("reply-parent-user-id"),
            replyParentMessageSenderDisplayName: msg.tags.get("reply-parent-display-name"),
            threadParentMessageId: msg.tags.get("reply-thread-parent-msg-id"),
            threadParentMessageSenderUserId: msg.tags.get("reply-thread-parent-user-id"),
            threadParentMessageSenderDisplayName: msg.tags.get("reply-thread-parent-display-name"),

            //TODO: Waiting for EventSub to supply these 3 fields
            isRaider: false,
            raidingFrom: "",
            isSuspiciousUser: false,

            rawText: msgText,
            whisper: whisper,
            whisperTarget: whisper === true ? msg.target : null,
            action: action,
            tagged: false,
            isCheer: msg.isCheer,
            badges: [],
            parts: [],
            roles: [],
            viewerRanks: {},
            viewerCustomRoles: [],
            isSharedChatMessage,
            sharedChatRoomId,
            sharedChatRoomUsername: sharedChatRoom?.broadcasterName,
            sharedChatRoomDisplayName: sharedChatRoom?.broadcasterDisplayName
        };

        const profilePicUrl = await this.getUserProfilePicUrl(firebotChatMessage.userId);
        firebotChatMessage.profilePicUrl = profilePicUrl;

        await this.enrichMessageWithRanksAndRoles(firebotChatMessage);

        const { streamer, bot } = AccountAccess.getAccounts();

        /**
         * this is a hack to override the message param for actions.
         * Action message params normally have some weird control characters and an "ACTION" prefix (look up CTCP for IRC).
         * The twitch library we use has a bug where it doesnt take this into account in msg.parseEmotes()
         * So here we are overriding the internal message param with the raw text before we call parseEmotes
         */
        //@ts-ignore
        if (action && msg._params && msg._params.length > 1) {
            //@ts-ignore
            msg._params[1].value = msgText;
        }

        const messageParts = this._parseMessageParts(firebotChatMessage,
            parseChatMessage(msgText, msg.emoteOffsets, this._twitchCheermotes?.getPossibleNames()));

        firebotChatMessage.parts = messageParts;

        if (firebotChatMessage.isReply) {
            const replyUsername = msg.tags.get("reply-parent-user-login");
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

        if (this._badgeCache != null) {
            firebotChatMessage.badges = this._getChatBadges(msg.userInfo.badges);
        }

        firebotChatMessage.isFounder = msg.userInfo.isFounder;
        firebotChatMessage.isMod = msg.userInfo.isMod;
        firebotChatMessage.isSubscriber = msg.userInfo.isSubscriber;
        firebotChatMessage.isVip = msg.userInfo.isVip;

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

        firebotChatMessage.isCheer = msg.isCheer === true;

        firebotChatMessage.color = msg.userInfo.color;

        return firebotChatMessage;
    }

    async buildFirebotChatMessageFromExtensionMessage(text = "", extensionName: string, extensionIconUrl: string, badges: ExtensionBadge[], color: string, id: string) {
        const firebotChatMessage: FirebotChatMessage = {
            id: id,
            username: extensionName,
            userId: extensionName,
            userDisplayName: extensionName,
            rawText: text,
            profilePicUrl: extensionIconUrl,
            whisper: false,
            isExtension: true,
            action: false,
            tagged: false,
            isBroadcaster: false,
            color: color,
            badges: badges ? this._getChatBadges(new Map(
                badges.map((badge) => {
                    return [badge.id, badge.version];
                })
            )) : [],
            parts: this._getMessageParts(text),
            roles: [],
            isSharedChatMessage: false // todo: check if extension messages pass through Shared Chat, and if we can listen for it
        };

        firebotChatMessage.parts = this._parseMessageParts(firebotChatMessage, firebotChatMessage.parts);

        return firebotChatMessage;
    }

    async buildViewerFirebotChatMessageFromAutoModMessage(msg: EventSubAutoModMessageHoldV2Event) {
        const profilePicUrl = await this.getUserProfilePicUrl(msg.userId);

        const viewerFirebotChatMessage: FirebotChatMessage = {
            id: msg.messageId,
            username: msg.userName,
            userId: msg.userId,
            userDisplayName: msg.userDisplayName,
            rawText: msg.messageText,
            profilePicUrl: profilePicUrl,
            whisper: false,
            action: false,
            tagged: false,
            isBroadcaster: false,
            badges: [],
            parts: [],
            roles: [],
            viewerRanks: {},
            viewerCustomRoles: [],
            isAutoModHeld: true,
            autoModStatus: "pending",
            autoModReason: (msg.reason === "automod" ? msg.autoMod?.category : msg.reason === "blocked_term" ? "blocked term" : null) ?? "unknown",
            isSharedChatMessage: false // todo: check if automod messages have a way to associate them with shared chat
        };

        await this.enrichMessageWithRanksAndRoles(viewerFirebotChatMessage);

        const { streamer, bot } = AccountAccess.getAccounts();
        if ((streamer.loggedIn && (msg.messageText.includes(streamer.username) || msg.messageText.includes(streamer.displayName)))
            || (bot.loggedIn && (msg.messageText.includes(bot.username) || msg.messageText.includes(streamer.username)))
        ) {
            viewerFirebotChatMessage.tagged = true;
        }

        const flaggedPhrases = msg.reason === "automod"
            ? msg.autoMod?.boundaries?.map(b => b.text) ?? []
            : msg.blockedTerms?.map(b => b.text) ?? [];

        const flaggedPhrasesRegex = new RegExp(`(${flaggedPhrases.join("|")})`, "g");

        const parts = this._parseMessageParts(viewerFirebotChatMessage, msg.messageParts.flatMap((f): FirebotParsedMessagePart | FirebotParsedMessagePart[] => {
            if (f.type === "text") {
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
            if (f.type === "cheermote") {
                return {
                    type: "cheer",
                    amount: f.cheermote.bits,
                    name: f.text
                };
            }
            if (f.type === "emote") {
                return {
                    type: "emote",
                    id: f.emote.id,
                    name: f.text
                };
            }
        }));

        viewerFirebotChatMessage.parts = parts;

        return viewerFirebotChatMessage;
    }

    private async enrichMessageWithRanksAndRoles(firebotChatMessage: FirebotChatMessage) {
        const viewer = await viewerDatabase.getViewerById(firebotChatMessage.userId);
        firebotChatMessage.viewerRanks = Object.entries(viewer?.ranks || {}).reduce((obj, [ladderId, rankId]) => {
            const ladder = rankManager.getItem(ladderId);
            if (ladder && ladder.settings.showBadgeInChat && rankId) {
                obj[ladder.name] = ladder.ranks.find(r => r.id === rankId)?.name || "Unknown";
            }
            return obj;
        }, {} as Record<string, string>);

        const customRoles = roleManager.getAllCustomRolesForViewer(firebotChatMessage.userId);
        firebotChatMessage.viewerCustomRoles = customRoles
            .filter(r => r.showBadgeInChat)
            .map(r => r.name);
    }
}

const chatHelpers = new FirebotChatHelpers();

export = chatHelpers;