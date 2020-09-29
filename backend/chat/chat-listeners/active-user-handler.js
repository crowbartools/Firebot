"use strict";

const chatHelpers = require("../chat-helpers");

const { settings } = require("../../common/settings-access");

const frontendCommunicator = require("../../common/frontend-communicator");

const utils = require("../../utility");

const NodeCache = require("node-cache");
const DEFAULT_ACTIVE_TIMEOUT = 300; // 5 mins

// this is used only for setting "online: true" in user db (which is the used for currency payouts)
const onlineUsers = new NodeCache({ stdTTL: DEFAULT_ACTIVE_TIMEOUT, checkperiod: 15 });

// this is used for general active user features
const activeUsers = new NodeCache({ stdTTL: DEFAULT_ACTIVE_TIMEOUT, checkperiod: 15 });

/**
 * Check if user is active
 */
exports.userIsActive = (usernameOrId) => {
    if (typeof usernameOrId === 'string') {
        usernameOrId = usernameOrId.toLowerCase();
    }
    return activeUsers.get(usernameOrId) != null;
};

exports.getActiveUserCount = () => {
    // we divide by two because we add two entries for every user (username and id)
    return activeUsers.keys().length / 2;
};

exports.getRandomActiveUser = () => {
    const allActiveUsers = exports.getAllActiveUsers();
    const randomIndex = utils.getRandomInt(0, allActiveUsers.length - 1);
    return allActiveUsers[randomIndex];
};

/**
 * Simple User
 * @typedef {Object} User
 * @property {id} id
 * @property {string} username
 */

/**
  * @returns {User[]}
  */
exports.getAllActiveUsers = () => {
    return activeUsers.keys().filter(v => !isNaN(v)).map(id => {
        return {
            id: parseInt(id),
            username: activeUsers.get(id)
        };
    });
};

/**
 * Add or update an active user
 * @arg {import('twitch-chat-client/lib/ChatUser').ChatUser} chatUser
 */
exports.addActiveUser = async (chatUser, includeInOnline = false, forceActive = false) => {
    const userDatabase = require("../../database/userDatabase");

    const ttl = settings.getActiveChatUserListTimeout * 60;

    let user = await userDatabase.getUserById(chatUser.userId);

    const userDetails = {
        id: chatUser.userId,
        username: chatUser.userName,
        displayName: chatUser.displayName,
        twitchRoles: [
            ...(chatUser.isBroadcaster ? ['broadcaster'] : []),
            ...(chatUser.isFounder || chatUser.isSubscriber ? ['sub'] : []),
            ...(chatUser.isMod ? ['mod'] : []),
            ...(chatUser.isVip ? ['vip'] : [])
        ],
        profilePicUrl: (await chatHelpers.getUserProfilePicUrl(chatUser.userId))
    };

    if (user == null) {
        user = await userDatabase.addNewUserFromChat(userDetails, includeInOnline);
    }

    if (includeInOnline) {
        const userOnline = onlineUsers.get(chatUser.userId);
        if (userOnline) {
            onlineUsers.ttl(chatUser.userId, ttl);
        } else {
            onlineUsers.set(chatUser.userId, true, ttl);
            frontendCommunicator.send("twitch:chat:user-joined", {
                id: chatUser.userId,
                username: chatUser.displayName
            });
            await userDatabase.setChatUserOnline(userDetails);
        }
    }

    await userDatabase.incrementDbField(chatUser.userId, "chatMessages");

    if (!forceActive && user.disableActiveUserList) return;

    const userActive = activeUsers.get(chatUser.userId);
    if (!userActive) {
        activeUsers.set(chatUser.userId, chatUser.userName, ttl);
        activeUsers.set(chatUser.userName, chatUser.userId, ttl);
    } else {
        // user is still active reset ttl
        activeUsers.ttl(chatUser.userId, ttl);
        activeUsers.ttl(chatUser.userName, ttl);
    }
};

exports.removeActiveUser = async (usernameOrId) => {
    const isUsername = typeof usernameOrId === 'string';
    if (isUsername) {
        usernameOrId = usernameOrId.toLowerCase();
    }
    const other = activeUsers.get(usernameOrId);
    if (other == null) return;
    activeUsers.del([usernameOrId, other]);
};

exports.clearAllActiveUsers = () => {
    activeUsers.flushAll();
    onlineUsers.flushAll();
    frontendCommunicator.send("twitch:chat:clear-user-list");
};

onlineUsers.on("expired", userId => {
    const userDatabase = require("../../database/userDatabase");
    userDatabase.setChatUserOffline(userId);
    frontendCommunicator.send("twitch:chat:user-left", userId);
});