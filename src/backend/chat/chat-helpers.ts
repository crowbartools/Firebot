import {
    type ChatMessage,
    type ParsedMessageCheerPart,
    type ParsedMessagePart,
    parseChatMessage
} from "@twurple/chat";
import type { EventSubAutoModMessageHoldV2Event } from "@twurple/eventsub-base";

import type {
    FirebotChatMessage,
    FirebotCheermoteInstance,
    FirebotParsedMessagePart
} from "../../types";

import { AccountAccess } from "../common/account-access";
import { FirebotPronounManager } from "../pronouns/pronoun-manager";
import { SharedChatCache } from "../streaming-platforms/twitch/chat/shared-chat-cache";
import { type ChatBadge, TwitchEventSubChatHelpers } from "../streaming-platforms/twitch/api/eventsub/eventsub-chat-helpers";
import logger from "../logwrapper";
import { getUrlRegex } from "../utils";

interface ExtensionBadge {
    id: string;
    version: string;
}

class FirebotChatHelpers {
    private readonly URL_REGEX = getUrlRegex(false);

    parseCheermote(part: ParsedMessageCheerPart | FirebotParsedMessagePart): FirebotCheermoteInstance {
        const displayInfo = TwitchEventSubChatHelpers.twitchCheermotes.getCheermoteDisplayInfo(part.name, part.amount, {
            background: "light",
            state: "animated",
            scale: "4"
        });

        const staticDisplayInfo = TwitchEventSubChatHelpers.twitchCheermotes.getCheermoteDisplayInfo(part.name, part.amount, {
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

    private _parseMessageParts(firebotChatMessage: FirebotChatMessage, parts: ParsedMessagePart[] | FirebotParsedMessagePart[]) {
        if (firebotChatMessage == null || parts == null) {
            return [];
        }
        const { streamer, bot } = AccountAccess.getAccounts();
        return parts.flatMap((p: ParsedMessagePart | FirebotParsedMessagePart) => {
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
                    const thirdPartyEmote = TwitchEventSubChatHelpers.thirdPartyEmotes.find(e => e.code === word);
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
                            flagged: (p as FirebotParsedMessagePart).flagged
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

                let emote = TwitchEventSubChatHelpers.twitchEmotes.streamer.find(e => e.name === part.name);
                if (emote == null) {
                    emote = TwitchEventSubChatHelpers.twitchEmotes.bot.find(e => e.name === part.name);
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

    private _getChatBadges(badges: Map<string, string>): ChatBadge[] {
        if (TwitchEventSubChatHelpers.badges == null) {
            return [];
        }

        const chatBadges: ChatBadge[] = [];

        for (const [setName, version] of badges.entries()) {

            const set = TwitchEventSubChatHelpers.badges.find(b => b.id === setName);
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
        if (!TwitchEventSubChatHelpers.twitchEmotes) {
            const part: FirebotParsedMessagePart = {
                type: "text",
                text: text
            };
            return [part];
        }

        const words = text.split(" ");
        return words.map((word) => {
            let emoteId: string = null;
            let url = "";
            let animatedUrl = "";
            try {
                const foundEmote = Object.values(TwitchEventSubChatHelpers.twitchEmotes || {})
                    .flat()
                    .find(e => e.name === word);
                if (foundEmote) {
                    emoteId = foundEmote.id;
                    url = foundEmote.getStaticImageUrl("3.0");
                    animatedUrl = foundEmote.getAnimatedImageUrl("3.0");
                }
            } catch { }

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
            pronouns: await FirebotPronounManager.getUserFriendlyPronounString(msg.userInfo.userName),
            customRewardId: msg.tags.get("custom-reward-id") || undefined,
            isHighlighted: msg.tags.get("msg-id") === "highlighted-message",
            isAnnouncement: false,
            isHiddenFromChatFeed: false,
            isReply: msg.tags.has("reply-parent-msg-id"),
            isGigantified: isGigantified,
            replyParentMessageId: msg.tags.get("reply-parent-msg-id"),
            replyParentMessageText: msg.tags.get("reply-parent-msg-body"),
            replyParentMessageSenderUserId: msg.tags.get("reply-parent-user-id"),
            replyParentMessageSenderDisplayName: msg.tags.get("reply-parent-display-name"),
            threadParentMessageId: msg.tags.get("reply-thread-parent-msg-id"),
            threadParentMessageSenderUserId: msg.tags.get("reply-thread-parent-user-id"),
            threadParentMessageSenderDisplayName: msg.tags.get("reply-thread-parent-display-name"),

            //TODO: Waiting for EventSub to supply these fields
            isFirstChat: msg.isFirst ?? false,
            isReturningChatter: msg.isReturningChatter ?? false,
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
            sharedChatRoomDisplayName: sharedChatRoom?.broadcasterDisplayName,
            sharedChatRoomProfilePicUrl: sharedChatRoom?.profilePictureUrl
        };

        const profilePicUrl = await TwitchEventSubChatHelpers.getUserProfilePicUrl(firebotChatMessage.userId);
        firebotChatMessage.profilePicUrl = profilePicUrl;

        await TwitchEventSubChatHelpers.enrichMessageWithRanksAndRoles(firebotChatMessage);

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
            parseChatMessage(msgText, msg.emoteOffsets, TwitchEventSubChatHelpers.twitchCheermotes?.getPossibleNames()));

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

        if (TwitchEventSubChatHelpers.badges != null) {
            firebotChatMessage.badges = this._getChatBadges(msg.userInfo.badges);
        }

        firebotChatMessage.isFounder = msg.userInfo.isFounder;
        firebotChatMessage.isMod = msg.userInfo.isMod || msg.userInfo.badges.has("lead_moderator");
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

        firebotChatMessage.color = TwitchEventSubChatHelpers.cacheUserColor(msg.userInfo.userId, msg.userInfo.color);

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
            isSharedChatMessage: false
        };

        firebotChatMessage.parts = this._parseMessageParts(firebotChatMessage, firebotChatMessage.parts);

        return firebotChatMessage;
    }

    async buildViewerFirebotChatMessageFromAutoModMessage(msg: EventSubAutoModMessageHoldV2Event) {
        const profilePicUrl = await TwitchEventSubChatHelpers.getUserProfilePicUrl(msg.userId);

        const viewerFirebotChatMessage: FirebotChatMessage = {
            id: msg.messageId,
            username: msg.userName,
            userId: msg.userId,
            userDisplayName: msg.userDisplayName,
            rawText: msg.messageText,
            profilePicUrl: profilePicUrl,
            pronouns: await FirebotPronounManager.getUserFriendlyPronounString(msg.userName),
            color: TwitchEventSubChatHelpers.cacheUserColor(msg.userId),
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

        await TwitchEventSubChatHelpers.enrichMessageWithRanksAndRoles(viewerFirebotChatMessage);

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
}

const chatHelpers = new FirebotChatHelpers();

export = chatHelpers;