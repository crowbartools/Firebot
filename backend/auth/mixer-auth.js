"use strict";

const authManager = require("./auth-manager");
const apiAccess = require("../api-access");
const channelAccess = require("../common/channel-access");
const accountAccess = require("../common/account-access");
const effectsManager = require("../effects/effectManager");


const MIXER_CLIENT_ID = "eb2f0f37d57de659852af2f409e95889c868d9caf128e396";
const HOST = "https://mixer.com";
const TOKEN_PATH = "/api/v1/oauth/token";
const AUTHORIZE_PATH = "/oauth/authorize";

const STREAMER_ACCOUNT_PROVIDER_ID = "mixer:streamer-account";
const BOT_ACCOUNT_PROVIDER_ID = "mixer:bot-account";

const STREAMER_ACCOUNT_PROVIDER = {
    id: STREAMER_ACCOUNT_PROVIDER_ID,
    name: "Streamer Account",
    client: {
        id: MIXER_CLIENT_ID
    },
    auth: {
        tokenHost: HOST,
        tokenPath: TOKEN_PATH,
        authorizePath: AUTHORIZE_PATH
    },
    scopes: 'user:details:self interactive:robot:self chat:connect chat:chat chat:whisper chat:bypass_links chat:bypass_slowchat chat:bypass_catbot chat:bypass_filter chat:clear_messages chat:giveaway_start chat:poll_start chat:remove_message chat:timeout chat:view_deleted chat:purge channel:details:self channel:update:self channel:clip:create:self channel:follow:self chat:ad_break'
};

const BOT_ACCOUNT_PROVIDER = {
    id: BOT_ACCOUNT_PROVIDER_ID,
    name: "Bot Account",
    client: {
        id: MIXER_CLIENT_ID
    },
    auth: {
        tokenHost: HOST,
        tokenPath: TOKEN_PATH,
        authorizePath: AUTHORIZE_PATH
    },
    scopes: 'chat:connect chat:chat chat:whisper chat:bypass_links chat:bypass_slowchat'
};

exports.registerMixerAuthProviders = () => {
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
            username: userData.username,
            userId: userData.id,
            channelId: userData.channel.id,
            avatar: userData.avatarUrl,
            auth: tokenData
        };

        if (accountType === "streamer") {
            const updatedStreamerAccount = await accountAccess.updateStreamerAccountSettings(accountObject);
            if (updatedStreamerAccount != null) {
                accountObject = updatedStreamerAccount;
            }
        }

        let clipEffect = effectsManager.getEffectById("firebot:clip");
        if (clipEffect) {
            clipEffect.definition.hidden = !accountObject.canClip;
        }

        accountAccess.updateAccount(accountType, accountObject);
    }
});