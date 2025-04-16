"use strict";

const chatHelpers = require("../chat-helpers");
const { SettingsManager } = require("../../common/settings-manager");
const frontendCommunicator = require("../../common/frontend-communicator");
const utils = require("../../utility");
const chatRolesManager = require("../../roles/chat-roles-manager");

const NodeCache = require("node-cache");
const DEFAULT_ACTIVE_TIMEOUT = 300; // 5 mins
const ONLINE_TIMEOUT = 450; // 7.50 mins

/**
 * Simple User
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 */

/**
 * @typedef {Object} UserDetails
 * @property {string} id
 * @property {string} username
 * @property {string} displayName
 * @property {string} profilePicUrl
 * @property {string[]} twitchRoles
 */

/**
 * @typedef {Object} ChatUser
 * @property {string} userId
 * @property {string} userName
 * @property {string} displayName
 * @property {boolean} [isBroadcaster]
 * @property {boolean} [isFounder]
 * @property {boolean} [isSubscriber]
 * @property {boolean} [isMod]
 * @property {boolean} [isVip]
 */

// this is used for online user features, mostly setting "online: true" in user db (which is the used for currency payouts)
const onlineUsers = new NodeCache({ stdTTL: ONLINE_TIMEOUT, checkperiod: 15 });

// this is used for general active user features
const activeUsers = new NodeCache({ stdTTL: DEFAULT_ACTIVE_TIMEOUT, checkperiod: 15 });

/**
 * Check if user is active
 * @param {string} usernameOrId
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
    // Ensure this isn't null
    ignoreUser = ignoreUser ?? "";

    const allActiveUsers = exports.getAllActiveUsers();

    /**@type {User} */
    let randomUser;
    do {
        const randomIndex = utils.getRandomInt(0, allActiveUsers.length - 1);
        randomUser = allActiveUsers[randomIndex];
    } while (randomUser?.username?.toLowerCase() === ignoreUser.toLowerCase() && allActiveUsers.length > 1);

    if (ignoreUser && randomUser?.username?.toLowerCase() === ignoreUser.toLowerCase()) {
        return null;
    }

    return randomUser;
};



/**
  * @returns {User[]}
  */
exports.getAllActiveUsers = () => {
    return activeUsers.keys().filter(v => !isNaN(v)).map((id) => {
        return {
            id: id,
            username: activeUsers.get(id)
        };
    });
};



exports.getOnlineUserCount = () => {
    return onlineUsers.keys().length;
};

/**
 * @param {string} ignoreUser
 * @returns {UserDetails|null}
 */
exports.getRandomOnlineUser = (ignoreUser = "") => {
    const allOnlineUsers = exports.getAllOnlineUsers();
    if (allOnlineUsers.length === 0) {
        return null;
    }

    /**@type {UserDetails} */
    let randomUser;
    do {
        const randomIndex = utils.getRandomInt(0, allOnlineUsers.length - 1);
        randomUser = allOnlineUsers[randomIndex];
    } while (randomUser.username.toLowerCase() === ignoreUser.toLowerCase() && allOnlineUsers.length > 1);

    if (ignoreUser && randomUser.username.toLowerCase() === ignoreUser.toLowerCase()) {
        return null;
    }

    return randomUser;
};

/**
  * @returns {UserDetails[]}
  */
exports.getAllOnlineUsers = () => {
    return onlineUsers.keys().filter(v => !isNaN(v)).map((id) => {
        return {
            id: id,
            ...onlineUsers.get(id)
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
    const viewerOnlineStatusManager = require("../../viewers/viewer-online-status-manager");

    const userOnline = onlineUsers.get(userDetails.id);
    if (userOnline && userOnline.online === true) {
        logger.debug(`Updating user ${userDetails.displayName}'s "online" ttl to ${ONLINE_TIMEOUT} secs`);
        onlineUsers.ttl(userDetails.id, ONLINE_TIMEOUT);
    } else {
        logger.debug(`Marking user ${userDetails.displayName} as online with ttl of ${ONLINE_TIMEOUT} secs`);
        onlineUsers.set(userDetails.id, {
            username: userDetails.username,
            displayName: userDetails.displayName,
            online: true,
            twitchRoles: userDetails.twitchRoles,
            profilePicUrl: userDetails.profilePicUrl
        }, ONLINE_TIMEOUT);

        const roles = await chatRolesManager.getUsersChatRoles(userDetails.id);

        frontendCommunicator.send("twitch:chat:user-joined", {
            id: userDetails.id,
            username: userDetails.username,
            displayName: userDetails.displayName,
            roles: roles,
            profilePicUrl: userDetails.profilePicUrl,
            active: exports.userIsActive(userDetails.id),
            disableViewerList: userDetails.disableViewerList
        });

        if (updateDb) {
            await viewerOnlineStatusManager.setChatViewerOnline(userDetails);
        }
    }
}

/** @param {import("@twurple/api").HelixChatChatter} viewer */
exports.addOnlineUser = async (viewer) => {
    const logger = require("../../logwrapper");
    const viewerDatabase = require("../../viewers/viewer-database");

    try {
        const firebotUser = await viewerDatabase.getViewerById(viewer.userId);

        if (firebotUser == null) {
            const twitchApi = require("../../twitch-api/api");
            const twitchUser = await twitchApi.users.getUserById(viewer.userId);

            if (twitchUser == null) {
                logger.warn(`Could not find Twitch user with ID '${viewer.userId}'`);
                return;
            }

            const roles = await chatRolesManager.getUsersChatRoles(twitchUser.id);

            const userDetails = {
                id: twitchUser.id,
                username: twitchUser.name,
                displayName: twitchUser.displayName,
                twitchRoles: roles,
                profilePicUrl: twitchUser.profilePictureUrl,
                disableViewerList: false
            };

            chatHelpers.setUserProfilePicUrl(twitchUser.id, twitchUser.profilePictureUrl);

            await viewerDatabase.addNewViewerFromChat(userDetails, true);

            await updateUserOnlineStatus(userDetails, false);
        } else {
            const userDetails = {
                id: firebotUser._id,
                username: viewer.userName,
                displayName: viewer.userDisplayName,
                twitchRoles: firebotUser.twitchRoles,
                profilePicUrl: firebotUser.profilePicUrl,
                disableViewerList: !!firebotUser.disableViewerList
            };
            await updateUserOnlineStatus(userDetails, true);
        }
    } catch (error) {
        logger.error(`Failed to set ${viewer.userDisplayName} as online`, error);
    }
};



/**
 * Add or update an active user
 * @arg {ChatUser} chatUser
 */
exports.addActiveUser = async (chatUser, includeInOnline = false, forceActive = false) => {

    if (chatUser.userName === "jtv" || chatUser.displayName === "jtv") {
        return;
    }

    const logger = require("../../logwrapper");

    const viewerDatabase = require("../../viewers/viewer-database");

    const ttl = SettingsManager.getSetting("ActiveChatUserListTimeout") * 60;

    let user = await viewerDatabase.getViewerById(chatUser.userId);

    const userDetails = {
        id: chatUser.userId,
        username: chatUser.userName.toLowerCase(),
        displayName: chatUser.displayName,
        twitchRoles: [
            ...(chatUser.isBroadcaster ? ['broadcaster'] : []),
            ...(chatUser.isFounder || chatUser.isSubscriber ? ['sub'] : []),
            ...(chatUser.isMod ? ['mod'] : []),
            ...(chatUser.isVip ? ['vip'] : [])
        ],
        profilePicUrl: (await chatHelpers.getUserProfilePicUrl(chatUser.userId)),
        disableViewerList: !!user?.disableViewerList
    };

    if (user == null) {
        user = await viewerDatabase.addNewViewerFromChat(userDetails, includeInOnline);
    }

    if (includeInOnline) {
        await updateUserOnlineStatus(userDetails, true);
    }

    await viewerDatabase.incrementDbField(userDetails.id, "chatMessages");

    if (!forceActive && user?.disableActiveUserList) {
        return;
    }

    const userActive = activeUsers.get(userDetails.id);
    if (!userActive) {
        logger.debug(`Marking user ${userDetails.displayName} as active with ttl of ${ttl} secs`, ttl);
        activeUsers.set(userDetails.id, userDetails.username, ttl);
        activeUsers.set(userDetails.username, userDetails.id, ttl);
        frontendCommunicator.send("twitch:chat:user-active", userDetails.id);
    } else {
        // user is still active reset ttl
        logger.debug(`Updating user ${userDetails.displayName}'s "active" ttl to ${ttl} secs`, ttl);
        activeUsers.ttl(userDetails.id, ttl);
        activeUsers.ttl(userDetails.username, ttl);
        frontendCommunicator.send("twitch:chat:user-active", userDetails.id);
    }
};

/**
 * @param {string} usernameOrId
 */
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

activeUsers.on("expired", (/** @type {string} */ usernameOrId) => {
    if (!isNaN(usernameOrId)) {
        frontendCommunicator.send("twitch:chat:user-inactive", usernameOrId);
    }
});

exports.clearAllActiveUsers = () => {
    activeUsers.flushAll();
    onlineUsers.flushAll();
    frontendCommunicator.send("twitch:chat:clear-user-list");
};

onlineUsers.on("expired", async (/** @type {string} */ userId) => {
    const viewerOnlineStatusManager = require("../../viewers/viewer-online-status-manager");
    await viewerOnlineStatusManager.setChatViewerOffline(userId);
    frontendCommunicator.send("twitch:chat:user-left", userId);
});
