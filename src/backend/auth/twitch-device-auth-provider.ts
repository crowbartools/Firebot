/* eslint camelcase: 0*/
/**
 *  This file exists because there's currently no Twurple AuthProvider that supports Device Code Flow.
 *  Once one exists, this can go away. In the meantime, it stays in order to refresh tokens automagically.
 */

import { EventEmitter } from '@d-fischer/typed-event-emitter';
import { CustomError, extractUserId, type UserIdResolvable } from '@twurple/common';
import type { AccessToken, AccessTokenMaybeWithUserId, AccessTokenWithUserId, TokenInfoData } from '@twurple/auth';
import { accessTokenIsExpired, InvalidTokenError, TokenInfo } from '@twurple/auth';
import type { AuthProvider } from '@twurple/auth';
import { callTwitchApi, HttpStatusCodeError } from '@twurple/api-call';

interface AccessTokenData {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    scope?: string[];
}

/**
 * Thrown whenever you try to execute an action in the context of a user
 * who is already known to have an invalid token saved in its {@link AuthProvider}.
 */
export class CachedRefreshFailureError extends CustomError {
    constructor(public readonly userId: string) {
        super(`Failed to refresh the user access token. This happened because the access token became invalid (e.g. by expiry) and refreshing it failed (e.g. because the account's password was changed). The user will need to reauthenticate to continue.`);
    }
}

/**
 * Gets information about an access token.
 *
 * @param accessToken The access token to get the information of.
 * @param clientId The client ID of your application.
 *
 * You need to obtain one using one of the [Twitch OAuth flows](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/).
 */
async function getTokenInfo(accessToken: string, clientId?: string): Promise<TokenInfo> {
    try {
        const data = await callTwitchApi<TokenInfoData>({ type: 'auth', url: 'validate' }, clientId, accessToken);
        return new TokenInfo(data);
    } catch (e) {
        if (e instanceof HttpStatusCodeError && e.statusCode === 401) {
            throw new InvalidTokenError({ cause: e });
        }
        throw e;
    }
}

/**
 * Compares scopes for a non-upgradable {@link AuthProvider} instance.
 *
 * @param scopesToCompare The scopes to compare against.
 * @param requestedScopes The scopes you requested.
 */
function compareScopes(scopesToCompare: string[], requestedScopes?: string[]): void {
    if (requestedScopes?.length) {
        const scopes = new Set<string>(scopesToCompare);

        if (requestedScopes.every(scope => !scopes.has(scope))) {
            const scopesStr = requestedScopes.join(', ');
            throw new Error(
                `This token does not have any of the requested scopes (${scopesStr}) and can not be upgraded.
If you need dynamically upgrading scopes, please implement the AuthProvider interface accordingly:

\thttps://twurple.js.org/reference/auth/interfaces/AuthProvider.html`
            );
        }
    }
}

/**
 * Compares scope sets for a non-upgradable {@link AuthProvider} instance.
 *
 * @param scopesToCompare The scopes to compare against.
 * @param requestedScopeSets The scope sets you requested.
 */
function compareScopeSets(scopesToCompare: string[], requestedScopeSets: string[][]): void {
    for (const requestedScopes of requestedScopeSets) {
        compareScopes(scopesToCompare, requestedScopes);
    }
}

/**
 * Compares scopes for a non-upgradable `AuthProvider` instance, loading them from the token if necessary,
 * and returns them together with the user ID.
 *
 * @param clientId The client ID of your application.
 * @param token The access token.
 * @param userId The user ID that was already loaded.
 * @param loadedScopes The scopes that were already loaded.
 * @param requestedScopeSets The scope sets you requested.
 */
async function loadAndCompareTokenInfo(
    clientId: string,
    token: string,
    userId?: string,
    loadedScopes?: string[],
    requestedScopeSets?: Array<string[] | undefined>
): Promise<[string[] | undefined, string]> {
    if (requestedScopeSets?.length || !userId) {
        const userInfo = await getTokenInfo(token, clientId);
        if (!userInfo.userId) {
            throw new Error('Trying to use an app access token as a user access token');
        }

        const scopesToCompare = loadedScopes ?? userInfo.scopes;
        if (requestedScopeSets) {
            compareScopeSets(
                scopesToCompare,
                requestedScopeSets.filter((val): val is string[] => Boolean(val))
            );
        }

        return [scopesToCompare, userInfo.userId];
    }

    return [loadedScopes, userId];
}

function createAccessTokenFromData(data: AccessTokenData): AccessToken {
    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        scope: data.scope ?? [],
        expiresIn: data.expires_in,
        obtainmentTimestamp: Date.now()
    };
}

/**
 * Refreshes an expired access token with your client credentials and the refresh token that was given by the initial authentication.
 *
 * @param clientId The client ID of your application.
 * @param clientSecret The client secret of your application.
 * @param refreshToken The refresh token.
 */
async function refreshUserToken(
    clientId: string,
    refreshToken: string
): Promise<AccessToken> {
    return createAccessTokenFromData(
        await callTwitchApi<AccessTokenData>({
            type: 'auth',
            url: 'token',
            method: 'POST',
            query: {
                grant_type: 'refresh_token',
                client_id: clientId,
                refresh_token: refreshToken
            }
        })
    );
}

interface DeviceAuthProviderConfig {
    userId: UserIdResolvable,
    clientId: string,
    accessToken: AccessToken,
    scopes: string[]
}

/**
 * An auth provider that returns a refreshable token for a given user obtained via Device Code Flow.
 */
export class DeviceAuthProvider extends EventEmitter implements AuthProvider {
    private _userId: string;
    private readonly _clientId: string;
    private _accessToken: AccessTokenWithUserId;
    private _scopes?: string[];
    private readonly _cachedRefreshFailures = new Set<string>();

    /**
     * Fires when a user token is refreshed.
     *
     * @param userId The ID of the user whose token was successfully refreshed.
     * @param token The refreshed token data.
     */
    readonly onRefresh = this.registerEvent<[userId: string, token: AccessToken]>();

    /**
     * Fires when a user token fails to refresh.
     *
     * @param userId The ID of the user whose token wasn't successfully refreshed.
     */
    readonly onRefreshFailure = this.registerEvent<[userId: string]>();

    /**
     * Creates a new auth provider with Device Code Flow credentials.
     *
     * @param clientId The client ID of your application.
     * @param accessToken The access token to provide.
     * @param scopes The scopes the supplied token has.
     */
    constructor(deviceAuthConfig: DeviceAuthProviderConfig) {
        super();

        this._userId = extractUserId(deviceAuthConfig.userId);
        this._clientId = deviceAuthConfig.clientId;
        this._accessToken = {
            ...deviceAuthConfig.accessToken,
            userId: this._userId
        };
        this._scopes = deviceAuthConfig.scopes;
    }

    /**
     * The client ID.
     */
    get clientId(): string {
        return this._clientId;
    }

    /**
     * Gets the access token.
     *
     * If the current access token does not have the requested scopes, this method throws.
     * This makes supplying an access token with the correct scopes from the beginning necessary.
     *
     * @param user Ignored.
     * @param scopeSets The requested scopes.
     */
    async getAccessTokenForUser(
        user: UserIdResolvable,
        ...scopeSets: Array<string[] | undefined>
    ): Promise<AccessTokenWithUserId> {
        return await this._getAccessToken(scopeSets);
    }

    /**
     * Gets the access token.
     *
     * If the current access token does not have the requested scopes, this method throws.
     * This makes supplying an access token with the correct scopes from the beginning necessary.
     *
     * @param intent Ignored.
     * @param scopeSets The requested scopes.
     */
    async getAccessTokenForIntent(
        intent: string,
        ...scopeSets: Array<string[] | undefined>
    ): Promise<AccessTokenWithUserId> {
        return await this._getAccessToken(scopeSets);
    }

    /**
     * Gets the access token.
     */
    async getAnyAccessToken(): Promise<AccessTokenMaybeWithUserId> {
        return await this._getAccessToken([]);
    }

    /**
     * The scopes that are currently available using the access token.
     */
    getCurrentScopesForUser(): string[] {
        return this._scopes ?? [];
    }

    /**
     * Requests that the provider fetches a new token from Twitch.
     *
     * @param user Ignored.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async refreshAccessTokenForUser(user: UserIdResolvable): Promise<AccessTokenWithUserId> {
        if (this._cachedRefreshFailures.has(this._userId)) {
            throw new CachedRefreshFailureError(this._userId);
        }

        if (!this._accessToken) {
            throw new Error('Trying to refresh non-existent token');
        }

        const tokenData = await this._refreshUserTokenWithCallback(this._accessToken.refreshToken);

        this._accessToken = {
            ...tokenData,
            userId: this._userId
        };
        this.emit(this.onRefresh, this._userId, tokenData);

        return this._accessToken;
    }

    /**
     * Requests that the provider fetches a new token from Twitch.
     *
     * @param intent Ignored.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async refreshAccessTokenForIntent(intent: string): Promise<AccessTokenWithUserId> {
        return await this.refreshAccessTokenForUser(null);
    }

    private async _getAccessToken(requestedScopeSets: Array<string[] | undefined>): Promise<AccessTokenWithUserId> {
        if (!accessTokenIsExpired(this._accessToken)) {
            try {
                // don't create new object on every get
                if (this._accessToken.scope) {
                    compareScopeSets(this._accessToken.scope, requestedScopeSets);
                    return this._accessToken as AccessTokenWithUserId;
                }

                const [scopes, userId] = await loadAndCompareTokenInfo(
                    this._clientId,
                    this._accessToken.accessToken,
                    this._userId,
                    this._scopes,
                    requestedScopeSets
                );

                this._scopes = scopes;
                this._userId = userId;

                return { ...this._accessToken, userId };
            } catch (e) {
                // if loading scopes failed, ignore InvalidTokenError and proceed with refreshing
                if (!(e instanceof InvalidTokenError)) {
                    throw e;
                }
            }

            const refreshedToken = await this.refreshAccessTokenForUser(null);
            compareScopeSets(refreshedToken.scope, requestedScopeSets);
            return refreshedToken;
        }

        return this._accessToken;
    }

    private async _refreshUserTokenWithCallback(refreshToken: string): Promise<AccessToken> {
        try {
            return await refreshUserToken(this.clientId, refreshToken);
        } catch (e) {
            this._cachedRefreshFailures.add(this._userId);
            this.emit(this.onRefreshFailure, this._userId);
            throw e;
        }
    }
}