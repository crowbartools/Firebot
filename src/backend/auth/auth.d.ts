import { TypedEmitter } from "tiny-typed-emitter";
import type ClientOAuth2 from "client-oauth2";

export interface AuthProviderDefinition {
    id: string;
    name: string;
    client: {
        id: string;
        secret?: string;
    };
    auth: {
        type: "code" | "token" | "device";
        authorizeHost?: string;
        tokenHost: string;
        authorizePath: string;
        tokenPath?: string;
    };
    options?: {
        body?: {
            [key: string]: string | string[];
        };
        query?: {
            [key: string]: string | string[];
        };
        headers?: {
            [key: string]: string | string[];
        };
    };
    redirectUriHost?: string;
    scopes?: string[] | string | undefined;
    autoRefreshToken: boolean;
}

export interface AuthProvider {
    id: string;
    oauthClient: ClientOAuth2;
    authorizationUri: string;
    redirectUri: string;
    tokenUri: string;
    details: AuthProviderDefinition;
}

// RFC6749 defines the following fields:
// - access_token : REQUIRED
// - refresh_token: OPTIONNAL
// - token_type : REQUIRED
// - expires_in: RECOMENDED
// - scope: OPTIONNAL. REQUIRED if different from client's request
// - state: REQUIRED
export interface AuthDetails {
    /** The access token */
    access_token: string;

    /** The refresh token */
    refresh_token?: string;

    /** The type of access token */
    token_type: string;

    /** OAuth scopes of the access token */
    scope?: string[];

    /** Timestamp of when the token has been created */
    created_at?: number;

    /** How many seconds before the token expires */
    expires_in?: number;

    /** Timestamp of when access token expires */
    expires_at?: number;

    /** Extra fields to be compatible with Type ClientOAuth2.Data */
    [key: string]: unknown;
}

export interface AuthManagerEvents {
    "auth-success": (providerId: string, tokenData: AuthDetails) => void
}

export declare class AuthManager extends TypedEmitter<AuthManagerEvents> {
    private readonly _httpPort;
    private _authProviders;
    constructor();
    registerAuthProvider(provider: AuthProviderDefinition): void;
    getAuthProvider(providerId: string): AuthProvider;
    buildOAuthClientForProvider(provider: AuthProviderDefinition, redirectUri: string): ClientOAuth2;
    getAuthDetails(accessToken: ClientOAuth2.Token): AuthDetails;
    createToken(providerId: string, tokenData: AuthDetails): ClientOAuth2.Token;
    tokenExpired(providerId: string, tokenData: AuthDetails): boolean;
    refreshTokenIfExpired(providerId: string, tokenData: AuthDetails): Promise<AuthDetails>;
    revokeTokens(providerId: string, tokenData: AuthDetails): Promise<void>;
    successfulAuth(providerId: string, tokenData: AuthDetails): void;
}