"use strict";

const logger = require("../logwrapper");
const accountAccess = require("../common/account-access");
const twitchClient = require("../twitch-api/client");
const uuid = require("uuid/v4");

/**@type {import('twitch/lib/API/Badges/ChatBadgeList').default} */
let badgeCache = null;
exports.cacheBadges = async () => {
    const streamer = accountAccess.getAccounts().streamer;
    const client = twitchClient.getClient();
    if (streamer.loggedIn && client) {
        badgeCache = await client.badges.getChannelBadges(streamer.userId, true);
    }
};

const profilePicUrlCache = {};
async function getUserProfilePicUrl(userId) {
    if (userId == null) {
        return null;
    }

    if (profilePicUrlCache[userId]) {
        return profilePicUrlCache[userId];
    }

    const streamer = accountAccess.getAccounts().streamer;
    const client = twitchClient.getClient();
    if (streamer.loggedIn && client) {
        const user = await client.helix.users.getUserById(userId);
        if (user) {
            profilePicUrlCache[userId] = user.profilePictureUrl;
            return user.profilePictureUrl;
        }
    }
    return null;
}
exports.getUserProfilePicUrl = getUserProfilePicUrl;

/**@type {import('twitch/lib/API/Kraken/Channel/EmoteSetList').default} */
let streamerEmotes = null;

exports.cacheStreamerEmotes = async () => {
    const client = twitchClient.getClient();
    const streamer = accountAccess.getAccounts().streamer;

    if (client == null || !streamer.loggedIn) return;

    streamerEmotes = await client.kraken.users.getUserEmotes(streamer.userId);
};

/**
 * @typedef FirebotChatMessage
 * @property {string} id
 * @property {string} username
 * @property {string} profilePicUrl
 * @property {number} userId
 * @property {string[]} roles
 * @property {any[]} badges
 * @property {string} customRewardId
 * @property {string} color
 * @property {string} rawText
 * @property {import('twitch-chat-client/lib/Toolkit/EmoteTools').ParsedMessagePart[]} parts
 * @property {boolean} whisper
 * @property {boolean} action
 * @property {boolean} isCheer
 * @property {boolean} tagged
 * @property {boolean} isFounder
 * @property {boolean} isBroadcaster
 * @property {boolean} isBot
 * @property {boolean} isMod
 * @property {boolean} isSubscriber
 * @property {boolean} isVip
 * @property {boolean} isCheer
 * @property {boolean} isHighlighted
 *
 */

exports.buildFirebotChatMessageFromText = async (text = "") => {
    const streamer = accountAccess.getAccounts().streamer;

    /**@type {FirebotChatMessage} */
    const streamerFirebotChatMessage = {
        id: uuid(),
        username: streamer.displayName,
        userId: streamer.userId,
        rawText: text,
        profilePicUrl: streamer.avatar,
        whisper: false,
        action: false,
        tagged: false,
        isBroadcaster: true,
        badges: [],
        parts: [],
        roles: [
            "broadcaster"
        ]
    };

    if (streamerEmotes) {
        const words = text.split(" ");
        for (const word of words) {
            let emoteId = null;
            try {
                emoteId = await streamerEmotes.findEmoteId(word);
            } catch (err) {
                logger.debug(`Failed to find emote id for ${word}`, err);
            }

            /**@type {import('twitch-chat-client/lib/Toolkit/EmoteTools').ParsedMessagePart} */
            let part;
            if (emoteId != null) {
                part = {
                    type: "emote",
                    url: `https://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/1.0`,
                    id: emoteId,
                    name: word
                };
            } else {
                part = {
                    type: "text",
                    text: `${word} `
                };
            }
            streamerFirebotChatMessage.parts.push(part);
        }
    } else {
        streamerFirebotChatMessage.parts.push({
            type: "text",
            text: text
        });
    }

    return streamerFirebotChatMessage;
};

/**@arg {import('twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage').default} msg
 * @returns {FirebotChatMessage}
*/
exports.buildFirebotChatMessage = async (msg, msgText, whisper = false, action = false) => {

    /**@type {FirebotChatMessage} */
    const firebotChatMessage = {
        id: msg.tags.get("id"),
        username: msg.userInfo.displayName,
        userId: msg.userInfo.userId,
        customRewardId: msg.tags.get("custom-reward-id"),
        isHighlighted: msg.tags.get("msg-id") === "highlighted-message",
        rawText: msgText,
        whisper: whisper,
        action: action,
        tagged: false,
        isCheer: msg.isCheer,
        badges: [],
        parts: [],
        roles: []
    };

    const profilePicUrl = await getUserProfilePicUrl(firebotChatMessage.userId);
    firebotChatMessage.profilePicUrl = profilePicUrl;

    const { streamer, bot } = accountAccess.getAccounts();

    /**
     * this is a hack to override the message param for actions.
     * Action message params normally have some weird control characters and an "ACTION" prefix (look up CTCP for IRC).
     * The twitch library we use has a bug where it doesnt take this into account in msg.parseEmotes()
     * So here we are overriding the internal message param with the raw text before we call parseEmotes
     */
    if (action && msg._params && msg._params.length > 1) {
        msg._params[1].value = msgText;
        msg.parseParams();
    }

    const messageParts = msg.parseEmotes();
    for (const part of messageParts) {
        if (part.type === "emote") {
            part.url = `https://static-cdn.jtvnw.net/emoticons/v1/${part.id}/1.0`;
        } else if (part.type === "text" &&
            !firebotChatMessage.whisper &&
            !firebotChatMessage.tagged &&
            streamer.loggedIn &&
            part.text != null &&
            part.text.includes(`@${streamer.username}`)) {
            firebotChatMessage.tagged = true;
        }
    }
    firebotChatMessage.parts = messageParts;

    if (badgeCache != null) {
        for (const [setName, version] of msg.userInfo.badges.entries()) {

            const set = badgeCache.getBadgeSet(setName);
            if (set == null) continue;

            const setVersion = set.getVersion(version);
            if (setVersion == null) continue;

            firebotChatMessage.badges.push({
                title: setVersion.title,
                url: setVersion.getImageUrl(2)
            });
        }
    }

    firebotChatMessage.isFounder = msg.userInfo.isFounder;
    firebotChatMessage.isMod = msg.userInfo.isMod;
    firebotChatMessage.isSubscriber = msg.userInfo.isSubscriber;
    firebotChatMessage.isVip = msg.userInfo.isVip;

    if (streamer.loggedIn && firebotChatMessage.username === streamer.displayName) {
        firebotChatMessage.isBroadcaster = true;
        firebotChatMessage.roles.push("broadcaster");
    }

    if (bot.loggedIn && firebotChatMessage.username === bot.displayName) {
        firebotChatMessage.isBot = true;
        firebotChatMessage.roles.push("bot");
    }

    if (firebotChatMessage.isFounder) {
        firebotChatMessage.roles.push("founder");
        firebotChatMessage.roles.push("sub");
    }
    if (firebotChatMessage.isMod) {
        firebotChatMessage.roles.push("mod");
    }
    if (firebotChatMessage.isSubscriber) {
        firebotChatMessage.roles.push("sub");
    }
    if (firebotChatMessage.isVip) {
        firebotChatMessage.roles.push("vip");
    }

    firebotChatMessage.isCheer = msg.isCheer === true;

    firebotChatMessage.color = msg.userInfo.color;

    return firebotChatMessage;
};