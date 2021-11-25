"use strict";

const authManager = require("./auth-manager");
const accountAccess = require("../common/account-access");
const logger = require("../logwrapper");
const axios = require("axios").default;

const { secrets } = require("../secrets-manager");

const TWITCH_CLIENT_ID = secrets.twitchClientId;
const TWITCH_CLIENT_SECRET = secrets.twitchClientSecret;

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
    scopes: [
        'bits:read',
        'channel:edit:commercial',
        'channel:moderate',
        'channel:read:hype_train',
        'channel:read:subscriptions',
        'channel:read:redemptions',
        'channel:manage:redemptions',
        'channel_commercial',
        'channel_editor',
        'channel_read',
        'channel_subscriptions',
        'chat:edit',
        'chat:read',
        'clips:edit',
        'user:manage:blocked_users',
        'user:read:broadcast',
        'whispers:read',
        'whispers:edit',
        'moderation:read',
        'user:edit:broadcast',
        'user_subscriptions',
        'user_follows_edit',
        'user_read'
    ].join(' ')
};

const BOT_ACCOUNT_PROVIDER = {
    id: BOT_ACCOUNT_PROVIDER_ID,
    name: "Bot Account",
    client: {
        id: TWITCH_CLIENT_ID,
        secret: TWITCH_CLIENT_SECRET
    },
    auth: {
        tokenHost: HOST,
        tokenPath: TOKEN_PATH,
        authorizePath: AUTHORIZE_PATH
    },
    scopes: 'channel:moderate chat:edit chat:read whispers:edit channel_read'
};

exports.registerTwitchAuthProviders = () => {
    authManager.registerAuthProvider(STREAMER_ACCOUNT_PROVIDER);
    authManager.registerAuthProvider(BOT_ACCOUNT_PROVIDER);
};

async function getUserCurrent(accessToken) {
    try {
        const response = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'Firebot v5',
                'Client-ID': TWITCH_CLIENT_ID
            },
            responseType: "json"
        });

        if (response.status >= 200 && response.status <= 204) {
            const userData = response.data;
            if (userData.data && userData.data.length > 0) {
                return userData.data[0];
            }
        }
    } catch (error) {
        logger.error("Error getting current twitch user", error);
    }
    return null;
}

authManager.on("auth-success", async authData => {
    let { providerId, tokenData } = authData;

    if (providerId === STREAMER_ACCOUNT_PROVIDER_ID || providerId === BOT_ACCOUNT_PROVIDER_ID) {
        const userData = await getUserCurrent(tokenData.access_token);
        if (userData == null) {
            return;
        }

        let accountType = providerId === STREAMER_ACCOUNT_PROVIDER_ID ? "streamer" : "bot";
        let accountObject = {
            username: userData.login,
            displayName: userData.display_name,
            channelId: userData.id,
            userId: userData.id,
            avatar: userData.profile_image_url,
            broadcasterType: userData.broadcaster_type,
            auth: tokenData
        };

        accountAccess.updateAccount(accountType, accountObject);
    }
});