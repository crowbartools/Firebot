"use strict";

const accountAccess = require("../../common/account-access");
const twitchApi = require("../client");
const { TwitchAPICallType } = require("twitch/lib");
const logger = require("../../logwrapper");

const getUserChatInfo = async (userId) => {
    const client = twitchApi.getClient();

    const streamer = accountAccess.getAccounts().streamer;

    const chatUser = await client.callApi({
        type: TwitchAPICallType.Kraken,
        url: `users/${userId}/chat/channels/${streamer.userId}`
    });

    return chatUser;
};

const getUserChatInfoByName = async (username) => {
    try {
        const client = twitchApi.getClient();
        const user = await client.helix.users.getUserByName(username);
        return getUserChatInfo(user.id);
    } catch (error) {
        logger.error("Couldn't get user chat info by name", error);
    }
};

const blockUserByName = async (username) => {
    try {
        const client = twitchApi.getClient();
        const user = await client.helix.users.getUserByName(username);
        await client.helix.users.createBlock(user.id);
    } catch (err) {
        logger.error("Couldn't block user", err);
    }
};

const unblockUserByName = async (username) => {
    try {
        const client = twitchApi.getClient();
        const user = await client.helix.users.getUserByName(username);
        await client.helix.users.deleteBlock(user.id);
    } catch (err) {
        logger.error("Couldn't unblock user", err);
    }
};

exports.getUserChatInfoByName = getUserChatInfoByName;
exports.blockUserByName = blockUserByName;
exports.unblockUserByName = unblockUserByName;