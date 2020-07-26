"use strict";

const chatHelpers = require("../chat-helpers");

const NodeCache = require("node-cache");
const ACTIVE_TIMEOUT = 300; // 5 mins
const activeUsers = new NodeCache({ stdTTL: ACTIVE_TIMEOUT, checkperiod: 15 });

const activeChattersRoleHandler = require("../../roles/role-managers/active-chatters");

/**
 * Add or update an active user
 * @arg {import('twitch-chat-client/lib/ChatUser').default} chatUser
 */
exports.addActiveUser = async (chatUser) => {
    const userDatabase = require("../../database/userDatabase");

    const userActive = activeUsers.get(chatUser.userId);

    // if user isnt active, cache active status, create db record
    if (!userActive) {
        activeUsers.set(chatUser.userId, true);

        const profilePicUrl = await chatHelpers.getUserProfilePicUrl(chatUser.userId);

        const user = await userDatabase.getUserById(chatUser.userId);

        const userDetails = {
            id: chatUser.userId,
            username: chatUser.userName,
            displayName: chatUser.displayName,
            profilePicUrl
        };

        if (user == null) {
            await userDatabase.addNewUserFromChat(userDetails);
        } else {
            await userDatabase.setChatUserOnline(userDetails);
        }

    } else {
        // user is still active reset ttl
        activeUsers.ttl(chatUser.userId, ACTIVE_TIMEOUT);
    }

    await activeChattersRoleHandler.addOrUpdateActiveChatter(chatUser.userId, chatUser.displayName);

    await userDatabase.incrementDbField(chatUser.userId, "chatMessages");
};

activeUsers.on("expired", key => {
    const userDatabase = require("../../database/userDatabase");
    userDatabase.setChatUserOffline(key);
});