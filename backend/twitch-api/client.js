"use strict";

const twitchAuth = require("../auth/twitch-auth");
const accountAccess = require("../common/account-access");

const TwitchClient = require('twitch').default;

/**@type {TwitchClient} */
let client;

exports.setupTwitchClient = () => {
    const streamer = accountAccess.getAccounts().streamer;
    if (!streamer.loggedIn) return;

    client = TwitchClient.withCredentials(
        twitchAuth.TWITCH_CLIENT_ID,
        streamer.auth.access_token,
        undefined,
        {
            secret: twitchAuth.TWITCH_CLIENT_SECRET,
            refreshToken: streamer.auth.refresh_token,
            onRefresh: (token) => {

            }
        }
    );
};

exports.getClient = () => client;