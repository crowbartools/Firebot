import type ClientOAuth2 from "client-oauth2";

export interface AuthProviderDefinition {
    id: string;
    name: string;
    client: {
        id: string;
        secret?: string;
    };
    auth: {
        type: "code" | "token";
        tokenHost: string;
        authorizePath: string;
        tokenPath?: string;
    }
    scopes?: string[] | string | undefined;
}

export interface AuthProvider {
    id: string;
    oauthClient: ClientOAuth2;
    authorizationUri: string;
    redirectUri: string;
    details: AuthProviderDefinition;
}

export interface AuthDetails {
    /** The access token */
    access_token: string;

    /** The type of access token */
    token_type: string;

    /** OAuth scopes of the access token */
    scope: string[];

    /** When the token was obtained, in epoch timestamp format */
    obtainment_timestamp?: number;

    /** How many seconds before the token expires */
    expires_in?: number;

    /** JSON representation of when access token expires */
    expires_at?: Date;

    /** The refresh token */
    refresh_token?: string;
}