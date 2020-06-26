"use strict";

const authManager = require("./auth-manager");
const apiAccess = require("../api-access");
const channelAccess = require("../common/channel-access");
const accountAccess = require("../common/account-access");

const TWITCH_CLIENT_ID = "umhhyrvkdriayr0psc3ttmsnq2j8h0";
const TWITCH_CLIENT_SECRET = "z681sr828rf5ql70ilpf3sk3ein9v7";

exports.TWITCH_CLIENT_ID = TWITCH_CLIENT_ID;
exports.TWITCH_CLIENT_SECRET = TWITCH_CLIENT_SECRET;

const HOST = "https://id.twitch.tv";
const TOKEN_PATH = "/oauth2/token";
const AUTHORIZE_PATH = "/oauth2/authorize";

const STREAMER_ACCOUNT_PROVIDER_ID = "twitch:streamer-account";
const BOT_ACCOUNT_PROVIDER_ID = "twitch:bot-account";

const STREAMER_ACCOUNT_PROVIDER = {
    id: STREAMER_ACCOUNT_PROVIDER_ID,
    name: "Streamer Account",
    client: {
        id: TWITCH_CLIENT_ID,
        secret: TWITCH_CLIENT_SECRET
    },
    auth: {
        tokenHost: HOST,
        tokenPath: TOKEN_PATH,
        authorizePath: AUTHORIZE_PATH
    },
    scopes: 'channel:edit:commercial bits:read channel:read:hype_train channel:read:subscriptions user:read:broadcast channel:moderate chat:edit chat:read whispers:read whispers:edit user:edit:broadcast user_subscriptions channel_commercial user_follows_edit'
};

const BOT_ACCOUNT_PROVIDER = {
    id: BOT_ACCOUNT_PROVIDER_ID,
    name: "Bot Account",
    client: {
        id: TWITCH_CLIENT_ID
    },
    auth: {
        tokenHost: HOST,
        tokenPath: TOKEN_PATH,
        authorizePath: AUTHORIZE_PATH
    },
    scopes: 'channel:moderate chat:edit chat:read whispers:edit'
};

exports.registerTwitchAuthProviders = () => {
    authManager.registerAuthProvider(STREAMER_ACCOUNT_PROVIDER);
    authManager.registerAuthProvider(BOT_ACCOUNT_PROVIDER);
};

authManager.on("auth-success", async authData => {
    let { providerId, tokenData } = authData;

    if (providerId === STREAMER_ACCOUNT_PROVIDER_ID || providerId === BOT_ACCOUNT_PROVIDER_ID) {
        const userData = await apiAccess.getUserCurrent(tokenData.access_token);
        if (userData == null) return;

        let accountType = providerId === STREAMER_ACCOUNT_PROVIDER_ID ? "streamer" : "bot";
        let accountObject = {
            username: userData.login,
            displayName: userData.display_name,
            channelId: userData.id,
            userId: userData.id,
            avatar: userData.profile_image_url,
            auth: tokenData
        };

        /*if (accountType === "streamer") {
            const updatedStreamerAccount = await accountAccess.updateStreamerAccountSettings(accountObject);
            if (updatedStreamerAccount != null) {
                accountObject = updatedStreamerAccount;
            }
        }*/

        accountAccess.updateAccount(accountType, accountObject);
    }
});