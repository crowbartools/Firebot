"use strict";

const refreshingAuthProvider = require("../auth/refreshing-auth-provider");
const { ApiClient } = require("@twurple/api");
const accountAccess = require("../common/account-access");
const logger = require("../logwrapper");

/** @type {ApiClient} */
let client = null;

/** @type {ApiClient} */
let botClient = null;

exports.setupApiClients = () => {
    if (accountAccess.getAccounts().streamer.loggedIn) {
        const streamerProvider = refreshingAuthProvider.getRefreshingAuthProviderForStreamer();
        if (!streamerProvider) {
            return;
        }

        client = new ApiClient({ authProvider: streamerProvider });

        logger.info("Finished setting up Twitch API client for streamer account.");
    }

    if (accountAccess.getAccounts().bot.loggedIn) {
        const botProvider = refreshingAuthProvider.getRefreshingAuthProviderForBot();
        if (!botProvider) {
            return;
        }

        botClient = new ApiClient({ authProvider: botProvider });
        logger.info("Finished setting up Twitch API client for bot account.");
    }
};

exports.getClient = () => client;
exports.getBotClient = () => botClient;

exports.channels = require("./resource/channels");
exports.channelRewards = require("./resource/channel-rewards");
exports.users = require("./resource/users");
exports.teams = require("./resource/teams");
exports.categories = require("./resource/categories");
exports.streamTags = require("./resource/stream-tags");
