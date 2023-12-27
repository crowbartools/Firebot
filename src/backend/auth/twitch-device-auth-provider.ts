/* eslint camelcase: 0*/
/**
 *  This file exists because there's currently no Twurple AuthProvider that supports Device Code Flow.
 *  Once one exists, this can go away. In the meantime, it stays in order to refresh tokens automagically.
 */

import { EventEmitter } from '@d-fischer/typed-event-emitter';
import { CustomError, extractUserId, type UserIdResolvable } from '@twurple/common';
import { AccessToken, AccessTokenMaybeWithUserId, AccessTokenWithUserId, TokenFetcher, TokenInfoData } from '@twurple/auth';
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
    accessToken: AccessToken
}

/**
 * An auth provider that returns a refreshable token for a given user obtained via Device Code Flow.
 */
export class DeviceAuthProvider extends EventEmitter implements AuthProvider {
    private _userId: string;
    private readonly _clientId: string;
    private _accessToken: AccessTokenWithUserId;
    private _tokenFetcher: TokenFetcher<AccessTokenWithUserId>;
    private _refreshPromise: Promise<AccessTokenWithUserId>;
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
     * @param deviceAuthConfig The config values for the Device Code Flow auth provider
     */
    constructor(deviceAuthConfig: DeviceAuthProviderConfig) {
        super();

        this._clientId = deviceAuthConfig.clientId;
        this._userId = extractUserId(deviceAuthConfig.userId);
        this._accessToken = {
            ...deviceAuthConfig.accessToken,
            userId: this._userId
        };
        this._tokenFetcher = new TokenFetcher(async scopes => await this._fetchUserToken(scopes));
    }

    /**
     * Requests that the provider fetches a new token from Twitch.
     *
     * @param user Ignored.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async refreshAccessTokenForUser(user: UserIdResolvable): Promise<AccessTokenWithUserId> {
        if (this._refreshPromise != null) {
            return this._refreshPromise;
        }

        return this._refreshPromise = new Promise<AccessTokenWithUserId>(async (resolve, reject) => {
            if (this._cachedRefreshFailures.has(this._userId)) {
                throw new CachedRefreshFailureError(this._userId);
            }

            try {
                const previousTokenData = this._accessToken;

                if (!previousTokenData) {
                    throw new Error('Trying to refresh non-existent token');
                }

                const tokenData = await this._refreshUserTokenWithCallback(previousTokenData.refreshToken);

                this._accessToken = {
                    ...tokenData,
                    userId: this._userId
                };
                this.emit(this.onRefresh, this._userId, tokenData);

                this._refreshPromise = null;
                return resolve({
                    ...tokenData,
                    userId: this._userId
                });

            } catch (error) {
                this._refreshPromise = null;
                return reject(error);
            }
        });
    }

    /**
     * Requests that the provider fetches a new token from Twitch.
     *
     * @param intent Ignored.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async refreshAccessTokenForIntent(intent: string): Promise<AccessTokenWithUserId> {
        // We're refreshing, so just wait for the updated token
        if (this._refreshPromise != null) {
            return this._refreshPromise;
        }

        return await this.refreshAccessTokenForUser(null);
    }

    /**
     * The client ID.
     */
    get clientId(): string {
        return this._clientId;
    }

    /**
     * The scopes that are currently available using the access token.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getCurrentScopesForUser(user: UserIdResolvable): string[] {
        return this._accessToken.scope ?? [];
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
        if (this._cachedRefreshFailures.has(this._userId)) {
            throw new CachedRefreshFailureError(this._userId);
        }

        // We're refreshing, so just wait for the updated token
        if (this._refreshPromise != null) {
            return this._refreshPromise;
        }

        return await this._tokenFetcher.fetch(...scopeSets);
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
        // We're refreshing, so just wait for the updated token
        if (this._refreshPromise != null) {
            return this._refreshPromise;
        }

        const token = await this.getAccessTokenForUser(this._userId, ...scopeSets);

        return {
            ...token,
            userId: this._userId
        };
    }

    /**
     * Gets the access token.
     */
    async getAnyAccessToken(): Promise<AccessTokenMaybeWithUserId> {
        // We're refreshing, so just wait for the updated token
        if (this._refreshPromise != null) {
            return this._refreshPromise;
        }

        const token = await this.getAccessTokenForUser(this._userId);

        return {
            ...token,
            userId: this._userId
        };
    }

    private async _fetchUserToken(scopeSets: Array<string[] | undefined>): Promise<AccessTokenWithUserId> {
        // We're refreshing, so just wait for the updated token
        if (this._refreshPromise != null) {
            return this._refreshPromise;
        }

        const previousToken = this._accessToken;

        if (!previousToken) {
            throw new Error('Trying to fetch non-existent token');
        }

        if (previousToken.accessToken && !accessTokenIsExpired(previousToken)) {
            try {
                // don't create new object on every get
                if (previousToken.scope) {
                    compareScopeSets(previousToken.scope, scopeSets);
                    return previousToken as AccessTokenWithUserId;
                }

                const [scope = []] = await loadAndCompareTokenInfo(
                    this._clientId,
                    previousToken.accessToken,
                    this._userId,
                    previousToken.scope,
                    scopeSets
                );

                const newToken: AccessTokenWithUserId = {
                    ...(previousToken as AccessTokenWithUserId),
                    scope
                };

                this._accessToken = newToken;
                return newToken;
            } catch (e) {
                // if loading scopes failed, ignore InvalidTokenError and proceed with refreshing
                if (!(e instanceof InvalidTokenError)) {
                    throw e;
                }
            }
        }

        const refreshedToken = await this.refreshAccessTokenForUser(null);
        compareScopeSets(refreshedToken.scope, scopeSets);
        return refreshedToken;
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