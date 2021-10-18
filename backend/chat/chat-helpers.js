"use strict";

const uuid = require("uuid/v4");
const logger = require("../logwrapper");
const accountAccess = require("../common/account-access");
const twitchClient = require("../twitch-api/api");
const bttv = require("./third-party/bttv");
const ffz = require("./third-party/ffz");
const frontendCommunicator = require("../common/frontend-communicator");

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

/**@type {import('@twurple/api').ChatBadgeSet[]} */
let badgeCache = null;
exports.cacheBadges = async () => {
    const streamer = accountAccess.getAccounts().streamer;
    const client = twitchClient.getClient();
    if (streamer.loggedIn && client) {
        try {
            const channelBadges = await client.chat.getChannelBadges(streamer.userId);
            const globalBadges = await client.chat.getGlobalBadges();
            badgeCache = [
                ...channelBadges,
                ...globalBadges
            ];
        } catch (error) {
            logger.error("Failed to get channel chat badges", error);
        }
    }
};

let streamerData = {
    color: "white",
    badges: new Map()
};
exports.setStreamerData = function(newStreamerData) {
    streamerData = newStreamerData;
};

let streamerEmotes = null;

exports.cacheStreamerEmotes = async () => {
    const client = twitchClient.getClient();
    const streamer = accountAccess.getAccounts().streamer;

    if (client == null || !streamer.loggedIn) return;

    try {
        const response = await client.chat.getChannelEmotes(streamer.userId);
        if (response && response.data) {
            streamerEmotes = response.data;
        } else {
            return null;
        }
    } catch (err) {
        logger.error("Failed to get streamer chat emotes", err);
        return null;
    }
};

/**
 * @typedef ThirdPartyEmote
 * @property {string} url
 * @property {string} code
 * @property {string} origin
 * @property {boolean} animated
 */

/**
 * @type {ThirdPartyEmote[]}
 */
let thirdPartyEmotes = [];

exports.cacheThirdPartyEmotes = async () => {
    const bttvEmotes = await bttv.getAllBttvEmotes();
    const ffzEmotes = await ffz.getAllFfzEmotes();
    thirdPartyEmotes = [
        ...bttvEmotes,
        ...ffzEmotes
    ];
};

exports.handleChatConnect = async () => {
    await exports.cacheBadges();

    await exports.cacheStreamerEmotes();

    await exports.cacheThirdPartyEmotes();

    frontendCommunicator.send("all-emotes", [
        ...Object.values(streamerEmotes || {})
            .flat()
            .map(e => ({
                url: e.images.url_1x,
                origin: "Twitch",
                code: e.name
            })),
        ...thirdPartyEmotes
    ]);
};

const updateAccountAvatar = (accountType, account, url) => {
    account.avatar = url;
    accountAccess.updateAccount(accountType, account, true);
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
        const user = await client.users.getUserById(userId);
        if (user) {
            profilePicUrlCache[userId] = user.profilePictureUrl;
            return user.profilePictureUrl;
        }
    }
    return null;
}
exports.getUserProfilePicUrl = getUserProfilePicUrl;
exports.setUserProfilePicUrl = (userId, url) => {
    if (userId == null || url == null) return;
    profilePicUrlCache[userId] = url;

    if (userId === accountAccess.getAccounts().streamer.userId) {
        updateAccountAvatar("streamer", accountAccess.getAccounts().streamer, url);
    } else if (userId === accountAccess.getAccounts().bot.userId) {
        updateAccountAvatar("bot", accountAccess.getAccounts().bot, url);
    }
};

const URL_REGEX = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)/i;

/**
 * @param {FirebotChatMessage} firebotChatMessage
 * @param {import('twitch-chat-client/lib/Toolkit/EmoteTools').ParsedMessagePart[]} parts
 */
function parseMessageParts(firebotChatMessage, parts) {
    if (firebotChatMessage == null || parts == null) return [];
    const { streamer, bot } = accountAccess.getAccounts();
    return parts.flatMap(p => {
        if (p.type === "text" && p.text != null) {

            if (firebotChatMessage.username !== streamer.displayName &&
                (!bot.loggedIn || firebotChatMessage.username !== bot.displayName)) {
                if (!firebotChatMessage.whisper &&
                !firebotChatMessage.tagged &&
                streamer.loggedIn &&
                p.text.includes(streamer.username)) {
                    firebotChatMessage.tagged = true;
                }
            }

            const subParts = [];
            for (const word of p.text.split(" ")) {
                // check for links
                if (URL_REGEX.test(word)) {
                    subParts.push({
                        type: "link",
                        text: `${word} `,
                        url: word.startsWith("http") ? word : `https://${word}`
                    });
                    continue;
                }

                // check for third party emotes
                const thirdPartyEmote = thirdPartyEmotes.find(e => e.code === word);
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
        if (p.type === "emote") {
            p.url = `https://static-cdn.jtvnw.net/emoticons/v1/${p.id}/1.0`;
            p.origin = "Twitch";
        }
        return p;
    });
}

const getChatBadges = (badges) => {
    const chatBadges = [];

    for (const [setName, version] of badges.entries()) {

        const set = badgeCache.find(b => b.id === setName);
        if (set == null) continue;

        const setVersion = set.getVersion(version);
        if (setVersion == null) continue;

        try {
            chatBadges.push({
                title: setVersion.id,
                url: setVersion.getImageUrl(2)
            });
        } catch (err) {
            logger.debug(`Failed to find badge ${setName} v:${version}`, err);
        }
    }

    return chatBadges;
};

exports.buildFirebotChatMessageFromText = async (text = "") => {
    const streamer = accountAccess.getAccounts().streamer;

    const action = text.startsWith("/me");

    if (action) {
        text = text.replace("/me", "");
    }

    /**@type {FirebotChatMessage} */
    const streamerFirebotChatMessage = {
        id: uuid(),
        username: streamer.displayName,
        userId: streamer.userId,
        rawText: text,
        profilePicUrl: streamer.avatar,
        whisper: false,
        action: action,
        tagged: false,
        isBroadcaster: true,
        color: streamerData.color,
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
                const foundEmote = Object.values(streamerEmotes || {})
                    .flat()
                    .find(e => e.name === word);
                if (foundEmote) {
                    emoteId = foundEmote.id;
                }
            } catch (err) {
                //logger.silly(`Failed to find emote id for ${word}`, err);
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

    streamerFirebotChatMessage.parts = parseMessageParts(streamerFirebotChatMessage, streamerFirebotChatMessage.parts);

    if (badgeCache != null) {
        streamerFirebotChatMessage.badges = getChatBadges(streamerData.badges);
    }

    return streamerFirebotChatMessage;
};

/**
 * @arg {import('twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage').TwitchPrivateMessage} msg
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

    const messageParts = parseMessageParts(firebotChatMessage, msg
        .parseEmotes());

    firebotChatMessage.parts = messageParts;

    if (badgeCache != null) {
        firebotChatMessage.badges = getChatBadges(msg.userInfo.badges);
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
};