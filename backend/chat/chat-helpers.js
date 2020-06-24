"use strict";

const accountAccess = require("../common/account-access");
const twitchClient = require("../twitch-api/client");
const { parseTwoDigitYear } = require("moment");

/**@type {import('twitch/lib/API/Badges/ChatBadgeList').default} */
let badgeCache = null;

exports.cacheBadges = async () => {
    const streamer = accountAccess.getAccounts().streamer;
    const client = twitchClient.getClient();
    if (streamer.loggedIn && client) {
        badgeCache = await client.badges.getChannelBadges(streamer.userId, true);
    }
};


/**
 * @typedef FirebotChatMessage
 * @property {string} username
 * @property {number} userId
 * @property {string[]} roles
 * @property {boolean} isMod
 *
 */

/**@arg {import('twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage').default} msg */
exports.parseChatMessage = (msg) => {

    const firebotChatMessage = {
        username: msg.userInfo.userName,
        userId: msg.userInfo.userId,
        badges: [],
        parts: []
    };

    const messageParts = msg.parseEmotes();
    for (const part of messageParts) {
        if (part.type === "emote") {
            part.url = `https://static-cdn.jtvnw.net/emoticons/v1/${part.id}/1.0`;
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

    return firebotChatMessage;
};