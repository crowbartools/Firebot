"use strict";

const EventEmitter = require("events");
const logger = require("../logwrapper");
const { settings } = require("../common/settings-access");
const OAuthClient = require("client-oauth2");

const HTTP_PORT = settings.getWebServerPort();

class AuthManager extends EventEmitter {
    constructor() {
        super();
        /** @type {import("./auth").AuthProvider[]} */
        this._authProviders = [];

        this.REDIRECT_URI = 'http://localhost:' + HTTP_PORT + '/api/v1/auth/callback';
    }

    /** @param {import("./auth").AuthProviderDefinition} provider */
    registerAuthProvider(provider) {
        if (provider == null) {
            return;
        }

        const redirectUrlHost = provider.redirectUriHost || "localhost";
        const redirectUri = `http://${redirectUrlHost}:${HTTP_PORT}/api/v1/auth/callback`;

        const oauthClient = this.buildOAuthClientForProvider(provider, redirectUri);

        const authorizationUri = provider.auth.type === "token"
            ? oauthClient.token.getUri()
            : oauthClient.code.getUri();

        const authProvider = {
            id: provider.id,
            oauthClient: oauthClient,
            authorizationUri: authorizationUri,
            redirectUri: redirectUri,
            details: provider
        };

        this._authProviders.push(authProvider);

        logger.debug(`Registered Auth Provider ${provider.name}`);
    }

    getAuthProvider(providerId) {
        return this._authProviders.find(p => p.id === providerId);
    }

    /** @param {import("./auth").AuthProviderDefinition} provider */
    buildOAuthClientForProvider(provider, redirectUri) {
        let scopes;
        if (provider.scopes) {
            scopes = Array.isArray(provider.scopes)
                ? scopes = provider.scopes
                : scopes = provider.scopes.split(" ");
        } else {
            scopes = [];
        }

        const authUri = `${provider.auth.tokenHost}${provider.auth.authorizePath}`;
        const tokenUri = `${provider.auth.tokenHost}${provider.auth.tokenPath ?? ""}`;

        return new OAuthClient({
            clientId: provider.client.id,
            clientSecret: provider.auth.type === "token" ? null : provider.client.secret,
            accessTokenUri: provider.auth.type === "token" ? null : tokenUri,
            authorizationUri: authUri,
            redirectUri: redirectUri,
            scopes: scopes,
            state: provider.id
        });
    }

    async refreshTokenIfExpired(providerId, tokenData) {
        const provider = this.getAuthProvider(providerId);
        let accessToken = provider.oauthClient.createToken(tokenData);

        if (accessToken.expired()) {
            try {
                const params = {
                    scope: provider.details.scopes
                };

                accessToken = await accessToken.refresh(params);
            } catch (error) {
                logger.warn('Error refreshing access token: ', error);
                return null;
            }
        }
        return accessToken.data;
    }

    async revokeTokens(providerId, tokenData) {
        const provider = this.getAuthProvider(providerId);
        if (provider == null) {
            return;
        }

        const accessToken = provider.oauthClient.createToken(tokenData);
        try {
            // Revokes both tokens, refresh token is only revoked if the access_token is properly revoked
            // TODO
        } catch (error) {
            logger.error('Error revoking token: ', error.message);
        }
    }

    successfulAuth(providerId, tokenData) {
        this.emit("auth-success", { providerId: providerId, tokenData: tokenData });
    }
}

const manager = new AuthManager();

module.exports = manager;