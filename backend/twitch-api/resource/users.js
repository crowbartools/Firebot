"use strict";

const twitchApi = require("../api");
const logger = require("../../logwrapper");

const blockUserByName = async (username) => {
    try {
        const client = twitchApi.getClient();
        const user = await client.users.getUserByName(username);
        await client.users.createBlock(user.id);
    } catch (err) {
        logger.error("Couldn't block user", err);
    }
};

const unblockUserByName = async (username) => {
    try {
        const client = twitchApi.getClient();
        const user = await client.users.getUserByName(username);
        await client.users.deleteBlock(user.id);
    } catch (err) {
        logger.error("Couldn't unblock user", err);
    }
};

exports.blockUserByName = blockUserByName;
exports.unblockUserByName = unblockUserByName;