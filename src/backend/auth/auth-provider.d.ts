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