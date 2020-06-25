"use strict";

const accountAccess = require("../common/account-access");
const twitchClient = require("../twitch-api/client");

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

/**
 * @typedef FirebotChatMessage
 * @property {string} id
 * @property {string} username
 * @property {string} profilePicUrl
 * @property {number} userId
 * @property {string[]} roles
 * @property {any[]} badges
 * @property {string} color
 * @property {import('twitch-chat-client/lib/Toolkit/EmoteTools').ParsedMessagePart} parts
 * @property {boolean} whisper
 * @property {boolean} action
 * @property {boolean} tagged
 * @property {boolean} isFounder
 * @property {boolean} isBroadcaster
 * @property {boolean} isBot
 * @property {boolean} isMod
 * @property {boolean} isSubscriber
 * @property {boolean} isVip
 * @property {boolean} isCheer
 *
 */

/**@arg {import('twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage').default} msg
 * @returns {FirebotChatMessage}
*/
exports.buildFirebotChatMessage = async (msg, whisper = false, action = false) => {

    /**@type {FirebotChatMessage} */
    const firebotChatMessage = {
        id: msg.tags.get("id"),
        username: msg.userInfo.userName,
        userId: msg.userInfo.userId,
        whisper: whisper,
        action: action,
        tagged: false,
        badges: [],
        parts: [],
        roles: []
    };

    const profilePicUrl = await getUserProfilePicUrl(firebotChatMessage.userId);
    firebotChatMessage.profilePicUrl = profilePicUrl;

    const { streamer, bot } = accountAccess.getAccounts();

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