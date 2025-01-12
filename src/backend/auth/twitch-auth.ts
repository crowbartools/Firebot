import authManager from "./auth-manager";
import accountAccess, { FirebotAccount } from "../common/account-access";
import logger from "../logwrapper";
import { SecretsManager } from "../secrets-manager";
import { AuthProviderDefinition } from "./auth";
import { getExpiryDateOfAccessToken } from "@twurple/auth";

class TwitchAuthProviders {
    private readonly _host = "https://id.twitch.tv";
    private readonly _authorizePath = "/oauth2/device";
    private readonly _tokenPath = "/oauth2/token";

    readonly streamerAccountProviderId = "twitch:streamer-account";
    readonly botAccountProviderId = "twitch:bot-account";

    readonly twitchClientId = SecretsManager.secrets.twitchClientId;

    readonly streamerAccountProvider: AuthProviderDefinition = {
        id: this.streamerAccountProviderId,
        name: "Streamer Account",
        client: {
            id: this.twitchClientId
        },
        auth: {
            tokenHost: this._host,
            authorizePath: this._authorizePath,
            tokenPath: this._tokenPath,
            type: "device"
        },
        scopes: [
            "bits:read",
            "channel:edit:commercial",
            "channel:manage:ads",
            "channel:manage:broadcast",
            "channel:manage:moderators",
            "channel:manage:polls",
            "channel:manage:predictions",
            "channel:manage:raids",
            "channel:manage:redemptions",
            "channel:manage:schedule",
            "channel:manage:videos",
            "channel:manage:vips",
            "channel:moderate",
            "channel:read:ads",
            "channel:read:charity",
            "channel:read:editors",
            "channel:read:goals",
            "channel:read:hype_train",
            "channel:read:polls",
            "channel:read:predictions",
            "channel:read:redemptions",
            "channel:read:stream_key",
            "channel:read:subscriptions",
            "channel:read:vips",
            "chat:edit",
            "chat:read",
            "clips:edit",
            "moderation:read",
            "moderator:manage:announcements",
            "moderator:manage:automod",
            "moderator:manage:automod_settings",
            "moderator:manage:banned_users",
            "moderator:manage:blocked_terms",
            "moderator:manage:chat_messages",
            "moderator:manage:chat_settings",
            "moderator:manage:shield_mode",
            "moderator:manage:shoutouts",
            "moderator:manage:unban_requests",
            "moderator:manage:warnings",
            "moderator:read:automod_settings",
            "moderator:read:banned_users",
            "moderator:read:blocked_terms",
            "moderator:read:chat_messages",
            "moderator:read:chat_settings",
            "moderator:read:chatters",
            "moderator:read:followers",
            "moderator:read:moderators",
            "moderator:read:shield_mode",
            "moderator:read:shoutouts",
            "moderator:read:unban_requests",
            "moderator:read:vips",
            "moderator:read:warnings",
            "user:edit:broadcast",
            "user:manage:blocked_users",
            "user:manage:whispers",
            "user:read:blocked_users",
            "user:read:broadcast",
            "user:read:chat",
            "user:read:emotes",
            "user:read:follows",
            "user:read:subscriptions",
            "user:write:chat",
            "whispers:edit",
            "whispers:read"
        ]
    };

    botAccountProvider: AuthProviderDefinition = {
        id: this.botAccountProviderId,
        name: "Bot Account",
        client: {
            id: this.twitchClientId
        },
        auth: {
            tokenHost: this._host,
            authorizePath: this._authorizePath,
            tokenPath: this._tokenPath,
            type: "device"
        },
        scopes: [
            "channel:moderate",
            "chat:edit",
            "chat:read",
            "moderator:manage:announcements",
            "user:manage:whispers",
            "user:read:chat",
            "user:read:emotes",
            "user:write:chat",
            "whispers:edit",
            "whispers:read"
        ]
    };

    registerTwitchAuthProviders() {
        authManager.registerAuthProvider(this.streamerAccountProvider);
        authManager.registerAuthProvider(this.botAccountProvider);
    }
}

const twitchAuthProviders = new TwitchAuthProviders();

async function getUserCurrent(accessToken: string) {
    try {
        const response = await fetch("https://api.twitch.tv/helix/users", {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "User-Agent": "Firebot v5",
                "Client-ID": twitchAuthProviders.twitchClientId,
                "Response-Type": "json"
            }
        });

        if (response.ok) {
            const userData = await response.json();
            if (userData.data && userData.data.length > 0) {
                return userData.data[0];
            }
        }
    } catch (error) {
        logger.error("Error getting current twitch user", error);
    }
    return null;
}

authManager.on("auth-success", async (authData) => {
    const { providerId, tokenData } = authData;

    if (providerId === twitchAuthProviders.streamerAccountProviderId
        || providerId === twitchAuthProviders.botAccountProviderId) {
        const userData = await getUserCurrent(tokenData.access_token);
        if (userData == null) {
            return;
        }

        const obtainmentTimestamp = Date.now();

        const accountType = providerId === twitchAuthProviders.streamerAccountProviderId ? "streamer" : "bot";
        const accountObject: FirebotAccount = {
            username: userData.login,
            displayName: userData.display_name,
            description: userData.description,
            channelId: userData.id,
            userId: userData.id,
            avatar: userData.profile_image_url,
            broadcasterType: userData.broadcaster_type,
            auth: {
                ...tokenData,
                obtainment_timestamp: obtainmentTimestamp, // eslint-disable-line camelcase
                expires_at: getExpiryDateOfAccessToken({ // eslint-disable-line camelcase
                    expiresIn: tokenData.expires_in,
                    obtainmentTimestamp: obtainmentTimestamp
                })
            }
        };

        accountAccess.updateAccount(accountType, accountObject);
    }
});

export = twitchAuthProviders;