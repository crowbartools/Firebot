"use strict";
const logger = require("../logwrapper");
const twitchAuth = require("./twitch-auth");
const { RefreshingAuthProvider, getExpiryDateOfAccessToken } = require("@twurple/auth");
const accountAccess = require("../common/account-access");
const twitchApi = require("../twitch-api/api");

/**@type {RefreshingAuthProvider} */
let refreshingAuthProvider;

/**@type {RefreshingAuthProvider} */
let botRefreshingAuthProvider;

/** @return {import("@twurple/auth").RefreshConfig} */
const getRefreshingAuthProvider = (account, accountType) => {
    return new RefreshingAuthProvider({
        clientId: twitchAuth.TWITCH_CLIENT_ID,
        clientSecret: twitchAuth.TWITCH_CLIENT_SECRET,
        refreshToken: account.auth.refresh_token,
        onRefresh: (token) => {
            logger.debug(`Persisting ${accountType} access token`);

            const auth = account.auth || {};
            auth.access_token = token.accessToken; // eslint-disable-line camelcase
            auth.refresh_token = token.refreshToken; // eslint-disable-line camelcase
            auth.expires_at = getExpiryDateOfAccessToken({ // eslint-disable-line camelcase
                expiresIn: token.expiresIn,
                obtainmentTimestamp: token.obtainmentTimestamp
            });

            account.auth = auth;
            accountAccess.updateAccount(accountType, account, false);
        }
    },
    {
        accessToken: account.auth.access_token,
        refreshToken: account.auth.refresh_token
    });
};

const setupRefreshingAuthProviders = () => {
    refreshingAuthProvider = null;
    botRefreshingAuthProvider = null;

    logger.info("Setting up refreshing auth providers...");

    const streamer = accountAccess.getAccounts().streamer;
    if (streamer.loggedIn) {
        refreshingAuthProvider = getRefreshingAuthProvider(streamer, "streamer");
        logger.info("Successfully setup streamer refreshing auth provider");
    } else {
        logger.info("Unable to setup refreshing auth provider as streamer account is not logged in.");
    }

    const bot = accountAccess.getAccounts().bot;
    if (bot.loggedIn) {
        botRefreshingAuthProvider = getRefreshingAuthProvider(bot, "bot");
        logger.info("Successfully setup bot refreshing auth provider");
    } else {
        logger.info("Unable to setup bot refreshing auth provider as bot account is not logged in.");
    }

    if (refreshingAuthProvider) {
        twitchApi.setupApiClients();
    }
};
accountAccess.events.on("account-update", () => {
    setupRefreshingAuthProviders();
});

exports.setupRefreshingAuthProviders = setupRefreshingAuthProviders;
exports.getRefreshingAuthProviderForStreamer = () => refreshingAuthProvider;
exports.getRefreshingAuthProviderForBot = () => botRefreshingAuthProvider;