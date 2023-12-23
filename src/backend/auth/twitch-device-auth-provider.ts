/* eslint camelcase: 0*/
/**
 *  This file exists because there's currently no Twurple AuthProvider that supports Device Code Flow.
 *  Once one exists, this can go away. In the meantime, it stays in order to refresh tokens automagically.
 */

import { Enumerable } from '@d-fischer/shared-utils';
import { EventEmitter } from '@d-fischer/typed-event-emitter';
import { CustomError, extractUserId, type UserIdResolvable } from '@twurple/common';
import type { AccessToken, AccessTokenMaybeWithUserId, AccessTokenWithUserId, TokenInfoData } from '@twurple/auth';
import { InvalidTokenError, TokenInfo } from '@twurple/auth';
import type { AuthProvider } from '@twurple/auth';
import { callTwitchApi, HttpStatusCodeError } from '@twurple/api-call';

const scopeEquivalencies = new Map([
    ['channel_commercial', ['channel:edit:commercial']],
    ['channel_editor', ['channel:manage:broadcast']],
    ['channel_read', ['channel:read:stream_key']],
    ['channel_subscriptions', ['channel:read:subscriptions']],
    ['user_blocks_read', ['user:read:blocked_users']],
    ['user_blocks_edit', ['user:manage:blocked_users']],
    ['user_follows_edit', ['user:edit:follows']],
    ['user_read', ['user:read:email']],
    ['user_subscriptions', ['user:read:subscriptions']],
    ['user:edit:broadcast', ['channel:manage:broadcast', 'channel:manage:extensions']]
]);

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
        const scopes = new Set<string>(
            scopesToCompare.flatMap(scope => [scope, ...(scopeEquivalencies.get(scope) ?? [])])
        );

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
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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

function createRefreshTokenQuery(clientId: string, refreshToken: string) {
    return {
        grant_type: 'refresh_token', // eslint-disable-line camelcase
        client_id: clientId, // eslint-disable-line camelcase
        refresh_token: refreshToken // eslint-disable-line camelcase
    };
}

function createAccessTokenFromData(data: AccessTokenData): AccessToken {
    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || null,
        scope: data.scope ?? [],
        expiresIn: data.expires_in ?? null,
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
            query: createRefreshTokenQuery(clientId, refreshToken)
        })
    );
}

interface DeviceAuthProviderConfig {
    userId: UserIdResolvable,
    clientId: string,
    accessToken: string | AccessToken,
    scopes?: string[]
}

/**
 * An auth provider that always returns the same initially given credentials.
 *
 * This has the added benefit of refreshing tokens for Device Code Flow.
 */
export class DeviceAuthProvider extends EventEmitter implements AuthProvider {
    /** @internal */ @Enumerable(false) private readonly _clientId: string; // eslint-disable-line new-cap
    /** @internal */ @Enumerable(false) private _accessToken: AccessToken; // eslint-disable-line new-cap
    private _userId?: string;
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
     * Creates a new auth provider with static credentials.
     *
     * @param clientId The client ID of your application.
     * @param accessToken The access token to provide.
     *
     * You need to obtain one using one of the [Twitch OAuth flows](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/).
     * @param scopes The scopes the supplied token has.
     *
     * If this argument is given, the scopes need to be correct, or weird things might happen. If it's not (i.e. it's `undefined`), we fetch the correct scopes for you.
     *
     * If you can't exactly say which scopes your token has, don't use this parameter/set it to `undefined`.
     */
    constructor(deviceAuthConfig: DeviceAuthProviderConfig) {
        super();

        this._userId = extractUserId(deviceAuthConfig.userId);
        this._clientId = deviceAuthConfig.clientId;
        this._accessToken =
            typeof deviceAuthConfig.accessToken === 'string'
                ? {
                    accessToken: deviceAuthConfig.accessToken,
                    refreshToken: null,
                    scope: deviceAuthConfig.scopes ?? [],
                    expiresIn: null,
                    obtainmentTimestamp: Date.now()
                }
                : deviceAuthConfig.accessToken;
        this._scopes = deviceAuthConfig.scopes;
    }

    /**
     * The client ID.
     */
    get clientId(): string {
        return this._clientId;
    }

    /**
     * Gets the static access token.
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
     * Gets the static access token.
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
     * Gets the static access token.
     */
    async getAnyAccessToken(): Promise<AccessTokenMaybeWithUserId> {
        return await this._getAccessToken();
    }

    /**
     * The scopes that are currently available using the access token.
     */
    getCurrentScopesForUser(): string[] {
        return this._scopes ?? [];
    }

    /**
     * Requests that the provider fetches a new token from Twitch for the given user.
     *
     * @param user The user to refresh the token for.
     */
    async refreshAccessTokenForUser(user: UserIdResolvable): Promise<AccessTokenWithUserId> {
        const userId = extractUserId(user);

        if (this._cachedRefreshFailures.has(userId)) {
            throw new CachedRefreshFailureError(userId);
        }

        const previousTokenData = this._accessToken;

        if (!previousTokenData) {
            throw new Error('Trying to refresh non-existent token');
        }

        const tokenData = await this._refreshUserTokenWithCallback(userId, previousTokenData.refreshToken!);

        this._accessToken = tokenData;
        this.emit(this.onRefresh, userId, tokenData);

        return {
            ...tokenData,
            userId
        };
    }

    /**
     * Requests that the provider fetches a new token from Twitch for the given intent.
     *
     * @param intent The intent to refresh the token for.
     */
    async refreshAccessTokenForIntent(intent: string): Promise<AccessTokenWithUserId> {
        const userId = this._userId!;

        return await this.refreshAccessTokenForUser(userId);
    }

    private async _getAccessToken(requestedScopeSets?: Array<string[] | undefined>): Promise<AccessTokenWithUserId> {
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
    }

    private async _refreshUserTokenWithCallback(userId: string, refreshToken: string): Promise<AccessToken> {
        try {
            return await refreshUserToken(this.clientId, refreshToken);
        } catch (e) {
            this._cachedRefreshFailures.add(userId);
            this.emit(this.onRefreshFailure, userId);
            throw e;
        }
    }
}