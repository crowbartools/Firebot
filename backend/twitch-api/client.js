"use strict";

const twitchAuth = require("../auth/twitch-auth");
const accountAccess = require("../common/account-access");

const TwitchClient = require('twitch').default;

/**@type {TwitchClient} */
let client;

/**@type {TwitchClient} */
let botClient;

exports.setupTwitchClient = () => {
    const streamer = accountAccess.getAccounts().streamer;
    if (!streamer.loggedIn) return;

    client = TwitchClient.withCredentials(
        twitchAuth.TWITCH_CLIENT_ID,
        streamer.auth.access_token,
        undefined,
        {
            clientSecret: twitchAuth.TWITCH_CLIENT_SECRET,
            refreshToken: streamer.auth.refresh_token,
            expiry: streamer.auth.expires_at != null ? new Date(streamer.auth.expires_at) : undefined,
            onRefresh: (token) => {
                const streamer = accountAccess.getAccounts().streamer;

                const auth = streamer.auth || {};
                auth.access_token = token.accessToken; // eslint-disable-line camelcase
                auth.refresh_token = token.refreshToken; // eslint-disable-line camelcase
                auth.expires_at = token.expiryDate; // eslint-disable-line camelcase
                streamer.auth = auth;

                accountAccess.updateAccount("streamer", streamer);
            }
        }
    );

    const bot = accountAccess.getAccounts().bot;
    if (!bot.loggedIn) return;
    botClient = TwitchClient.withCredentials(
        twitchAuth.TWITCH_CLIENT_ID,
        bot.auth.access_token,
        undefined,
        {
            secret: twitchAuth.TWITCH_CLIENT_SECRET,
            refreshToken: bot.auth.refresh_token,
            onRefresh: (token) => {
                const botAccount = accountAccess.getAccounts().bot;

                const auth = botAccount.auth || {};
                auth.access_token = token.accessToken; // eslint-disable-line camelcase
                auth.refresh_token = token.refreshToken; // eslint-disable-line camelcase
                auth.expires_at = token.expiryDate; // eslint-disable-line camelcase
                auth.scope = token.scope;
                botAccount.auth = auth;

                accountAccess.updateAccount("bot", botAccount);
            }
        }
    );
};

exports.getClient = () => client;
exports.getBotClient = () => botClient;