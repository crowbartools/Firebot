"use strict";

const chatHelpers = require("../chat-helpers");
const { settings } = require("../../common/settings-access");
const frontendCommunicator = require("../../common/frontend-communicator");
const utils = require("../../utility");
const chatRolesManager = require("../../roles/chat-roles-manager");

const NodeCache = require("node-cache");
const DEFAULT_ACTIVE_TIMEOUT = 300; // 5 mins
const ONLINE_TIMEOUT = 450; // 7.50 mins

/**
 * Simple User
 * @typedef {Object} User
 * @property {id} id
 * @property {string} username
 */

/**
 * @typedef {Object} UserDetails
 * @property {number} id
 * @property {string} username
 * @property {string} displayName
 * @property {string} profilePicUrl
 * @property {string[]} twitchRoles
 */

// this is used only for setting "online: true" in user db (which is the used for currency payouts)
const onlineUsers = new NodeCache({ stdTTL: ONLINE_TIMEOUT, checkperiod: 15 });

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

exports.getRandomActiveUser = (ignoreUser = "") => {
    const allActiveUsers = exports.getAllActiveUsers();

    /**@type {User} */
    let randomUser;
    do {
        const randomIndex = utils.getRandomInt(0, allActiveUsers.length - 1);
        randomUser = allActiveUsers[randomIndex];
    } while (randomUser.username.toLowerCase() === ignoreUser.toLowerCase() && allActiveUsers.length > 1);

    if (ignoreUser && randomUser.username.toLowerCase() === ignoreUser.toLowerCase()) {
        return null;
    }

    return randomUser;
};



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
 *
 * @param {UserDetails} userDetails
 * @param {boolean} [updateDb]
 */
async function updateUserOnlineStatus(userDetails, updateDb = false) {
    const logger = require("../../logwrapper");
    const userDatabase = require("../../database/userDatabase");

    const userOnline = onlineUsers.get(userDetails.id);
    if (userOnline) {
        logger.debug(`Updating user ${userDetails.displayName}'s "online" ttl to ${ONLINE_TIMEOUT} secs`);
        onlineUsers.ttl(userDetails.id, ONLINE_TIMEOUT);
    } else {
        logger.debug(`Marking user ${userDetails.displayName} as online with ttl of ${ONLINE_TIMEOUT} secs`);
        onlineUsers.set(userDetails.id, true, ONLINE_TIMEOUT);

        const roles = await chatRolesManager.getUsersChatRoles(userDetails.id);

        frontendCommunicator.send("twitch:chat:user-joined", {
            id: userDetails.id,
            username: userDetails.displayName,
            roles: roles,
            profilePicUrl: userDetails.profilePicUrl,
            active: exports.userIsActive(userDetails.id),
            disableViewerList: userDetails.disableViewerList
        });

        if (updateDb) {
            await userDatabase.setChatUserOnline(userDetails);
        }
    }
}

exports.addOnlineUser = async (username) => {
    const logger = require("../../logwrapper");
    const userDatabase = require("../../database/userDatabase");

    try {
        const firebotUser = await userDatabase.getTwitchUserByUsername(username);

        if (firebotUser == null) {
            const twitchApi = require("../../twitch-api/api");
            const twitchUser = await twitchApi.getClient().users.getUserByName(username);

            if (twitchUser == null) {
                logger.warn(`Could not find twitch user with username '${username}'`);
                return;
            }

            const userDetails = {
                id: twitchUser.id,
                username: twitchUser.name,
                displayName: twitchUser.displayName,
                twitchRoles: [],
                profilePicUrl: twitchUser.profilePictureUrl,
                disableViewerList: false
            };

            chatHelpers.setUserProfilePicUrl(twitchUser.id, twitchUser.profilePictureUrl);

            await userDatabase.addNewUserFromChat(userDetails, true);

            await updateUserOnlineStatus(userDetails, false);

        } else {
            const userDetails = {
                id: firebotUser._id,
                username: firebotUser.username,
                displayName: firebotUser.displayName,
                twitchRoles: firebotUser.twitchRoles,
                profilePicUrl: firebotUser.profilePicUrl,
                disableViewerList: !!firebotUser.disableViewerList
            };
            await updateUserOnlineStatus(userDetails, true);
        }
    } catch (error) {
        logger.error(`Failed to set ${username} as online`, error);
    }
};



/**
 * Add or update an active user
 * @arg {import('@twurple/chat').ChatUser} chatUser
 */
exports.addActiveUser = async (chatUser, includeInOnline = false, forceActive = false) => {

    if (chatUser.userName === "jtv" || chatUser.displayName === "jtv") {
        return;
    }

    const logger = require("../../logwrapper");

    const userDatabase = require("../../database/userDatabase");

    const ttl = settings.getActiveChatUserListTimeout() * 60;

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
        profilePicUrl: (await chatHelpers.getUserProfilePicUrl(chatUser.userId)),
        disableViewerList: !!user.disableViewerList
    };

    if (user == null) {
        user = await userDatabase.addNewUserFromChat(userDetails, includeInOnline);
    }

    if (includeInOnline) {
        await updateUserOnlineStatus(userDetails, true);
    }

    await userDatabase.incrementDbField(chatUser.userId, "chatMessages");

    if (!forceActive && user.disableActiveUserList) {
        return;
    }

    const userActive = activeUsers.get(chatUser.userId);
    if (!userActive) {
        logger.debug(`Marking user ${chatUser.displayName} as active with ttl of ${ttl} secs`, ttl);
        activeUsers.set(chatUser.userId, chatUser.userName, ttl);
        activeUsers.set(chatUser.userName, chatUser.userId, ttl);
        frontendCommunicator.send("twitch:chat:user-active", chatUser.userId);
    } else {
        // user is still active reset ttl
        logger.debug(`Updating user ${chatUser.displayName}'s "active" ttl to ${ttl} secs`, ttl);
        activeUsers.ttl(chatUser.userId, ttl);
        activeUsers.ttl(chatUser.userName, ttl);
        frontendCommunicator.send("twitch:chat:user-active", chatUser.userId);
    }
};

exports.removeActiveUser = async (usernameOrId) => {
    const isUsername = typeof usernameOrId === 'string';
    if (isUsername) {
        usernameOrId = usernameOrId.toLowerCase();
    }
    const other = activeUsers.get(usernameOrId);
    if (other == null) {
        return;
    }
    activeUsers.del([usernameOrId, other]);
    frontendCommunicator.send("twitch:chat:user-inactive", isUsername ? other : usernameOrId);
};

activeUsers.on("expired", usernameOrId => {
    if (!isNaN(usernameOrId)) {
        frontendCommunicator.send("twitch:chat:user-inactive", usernameOrId);
    }
});

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