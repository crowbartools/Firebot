import { TypedEmitter } from "tiny-typed-emitter";
import ClientOAuth2 from "client-oauth2";
import logger from "../logwrapper";
import { AuthProvider, AuthProviderDefinition, AuthDetails, AuthManagerEvents } from "./auth";
import { SettingsManager } from "../common/settings-manager";
import frontendCommunicator from "../common/frontend-communicator";
import { Notification, app } from "electron";
import windowManagement from "../app-management/electron/window-management";

class AuthManager extends TypedEmitter<AuthManagerEvents> {
    private readonly _httpPort: number;
    private _authProviders: AuthProvider[];

    constructor() {
        super();

        this._authProviders = [];
        this._httpPort = SettingsManager.getSetting("WebServerPort");
    }

    registerAuthProvider(provider: AuthProviderDefinition): void {
        if (provider == null) {
            return;
        }

        const redirectUrlHost = provider.redirectUriHost || "localhost";
        const redirectUri = `http://${redirectUrlHost}:${this._httpPort}/api/v1/auth/callback`;

        const oauthClient = this.buildOAuthClientForProvider(provider, redirectUri);

        let authorizationUri = "";

        switch (provider.auth.type) {
            case "token":
                authorizationUri = oauthClient.token.getUri();
                break;

            case "code":
                authorizationUri = oauthClient.code.getUri();
                break;

            case "device":
                authorizationUri = `${provider.auth.authorizeHost ?? provider.auth.tokenHost}${provider.auth.authorizePath}`;
                break;
        }

        const tokenUri =
            provider.auth.type === "device" ? `${provider.auth.tokenHost}${provider.auth.tokenPath ?? ""}` : null;

        const authProvider = {
            id: provider.id,
            oauthClient: oauthClient,
            authorizationUri: authorizationUri,
            tokenUri: tokenUri,
            redirectUri: redirectUri,
            details: provider
        };

        this._authProviders.push(authProvider);

        logger.debug(`Registered Auth Provider ${provider.name}`);
    }

    getAuthProvider(providerId: string): AuthProvider {
        return this._authProviders.find(p => p.id === providerId);
    }

    buildOAuthClientForProvider(provider: AuthProviderDefinition, redirectUri: string): ClientOAuth2 {
        let scopes: string[] = [];
        if (provider.scopes) {
            scopes = Array.isArray(provider.scopes)
                ? (scopes = provider.scopes)
                : (scopes = provider.scopes.split(" "));
        }

        const authUri = `${provider.auth.authorizeHost ?? provider.auth.tokenHost}${provider.auth.authorizePath}`;
        const tokenUri = `${provider.auth.tokenHost}${provider.auth.tokenPath ?? ""}`;

        // Provide client_id and client_secret in body by default. Override if any options are user-specified.
        const tokenOptions = { body: {} };
        if (provider.auth.type === "code") {
            tokenOptions.body["client_id"] = provider.client.id;
            tokenOptions.body["client_secret"] = provider.client.secret;
        }
        provider.options ??= { body: {} };
        provider.options.body = Object.assign(tokenOptions.body, provider.options.body ?? {});

        return new ClientOAuth2({
            clientId: provider.client.id,
            clientSecret: provider.auth.type === "code" ? provider.client.secret : null,
            accessTokenUri: provider.auth.type === "token" ? null : tokenUri,
            authorizationUri: authUri,
            redirectUri: redirectUri,
            scopes: scopes,
            state: provider.id,
            body: provider.options.body,
            query: provider.options?.query,
            headers: provider.options?.headers
        });
    }

    getAuthDetails(accessToken: ClientOAuth2.Token): AuthDetails {
        const tokenData: ClientOAuth2.Data = accessToken.data;
        const accessTokenData: AuthDetails = {
            access_token: tokenData.access_token, // eslint-disable-line camelcase
            refresh_token: tokenData.refresh_token, // eslint-disable-line camelcase
            token_type: tokenData.token_type, // eslint-disable-line camelcase
            scope: Array.isArray(tokenData.scope) ? (tokenData.scope) : (tokenData.scope.split(" "))
        };

        if (tokenData.expires_at && tokenData.expires_in) {
            // induce created_at if not given
            accessTokenData.expires_in = Number(tokenData.expires_in); // eslint-disable-line camelcase
            accessTokenData.expires_at = new Date(tokenData.expires_at); // eslint-disable-line camelcase
            accessTokenData.created_at = tokenData.created_at ? // eslint-disable-line camelcase
                new Date(tokenData.created_at) :
                new Date(accessTokenData.expires_at.getTime() - accessTokenData.expires_in * 1000);
        } else if (tokenData.expires_at && tokenData.created_at) {
            // induce expires_in
            accessTokenData.created_at = new Date(tokenData.created_at); // eslint-disable-line camelcase
            accessTokenData.expires_at = new Date(tokenData.expires_at); // eslint-disable-line camelcase
            accessTokenData.expires_in = (accessTokenData.expires_at.getTime() - accessTokenData.created_at.getTime()) / 1000; // eslint-disable-line camelcase
        } else if (tokenData.expires_in) {
            // induce expires_at
            // created_at = now if absent
            accessTokenData.expires_in = Number(tokenData.expires_in); // eslint-disable-line camelcase
            accessTokenData.created_at = new Date(tokenData?.created_at); // eslint-disable-line camelcase
            accessTokenData.expires_at = new Date(accessTokenData.created_at.getTime() + accessTokenData.expires_in * 1000); // eslint-disable-line camelcase
        } else if (tokenData.expires_at) {
            // induce expires_in
            // induce created_at = now
            accessTokenData.expires_at = new Date(tokenData.expires_at); // eslint-disable-line camelcase
            accessTokenData.created_at = new Date(); // eslint-disable-line camelcase
            accessTokenData.expires_in = (accessTokenData.expires_at.getTime() - accessTokenData.created_at.getTime()) / 1000; // eslint-disable-line camelcase
        } else {
            // Not enough info on expiry time
            // induce creation time
            accessTokenData.created_at = new Date(); // eslint-disable-line camelcase
        }
        return accessTokenData;
    }

    createToken(providerId: string, tokenData: AuthDetails): ClientOAuth2.Token {
        const provider = this.getAuthProvider(providerId);
        const accessToken = provider.oauthClient.createToken(tokenData as ClientOAuth2.Data);

        // Attempt to re-infer expiry date if data is malformed
        if (!tokenData.expires_at) {
            tokenData = this.getAuthDetails(accessToken);
        }

        // Hack to properly recreate the ClientOAuth2 object from the Firebot stored data
        if (!tokenData.expires_at) {
            logger.warn(`Token has no expiry data. Assuming it is still valid. `);
            // @ts-expect-error 2551
            accessToken.expires = Infinity;
        } else {
            // @ts-expect-error 2551
            accessToken.expires = new Date(tokenData.expires_at);
        }

        return accessToken;
    }

    tokenExpired(providerId: string, tokenData: AuthDetails): boolean {
        return this.createToken(providerId, tokenData).expired();
    }

    async refreshTokenIfExpired(providerId: string, tokenData: AuthDetails): Promise<AuthDetails> {
        const provider = this.getAuthProvider(providerId);
        let accessToken = this.createToken(providerId, tokenData);

        if (accessToken.expired()) {
            try {
                const params = {
                    scopes: Array.isArray(provider.details.scopes)
                        ? provider.details.scopes
                        : provider.details.scopes.split(" ")
                };

                accessToken = await accessToken.refresh(params);
            } catch (error) {
                logger.warn("Error refreshing access token: ", error);
                return null;
            }
        }

        return this.getAuthDetails(accessToken);
    }

    async revokeTokens(providerId: string, tokenData: AuthDetails): Promise<void> {
        const provider = this.getAuthProvider(providerId);
        if (provider == null) {
            return;
        }

        try {
            // Revokes both tokens, refresh token is only revoked if the access_token is properly revoked
            // TODO
        } catch (error) {
            logger.error("Error revoking token: ", error.message);
        }
    }

    successfulAuth(providerId: string, tokenData: AuthDetails): void {
        this.emit("auth-success", providerId, tokenData);
    }
}

const authManager = new AuthManager();

frontendCommunicator.onAsync("begin-device-auth", async (providerId: string): Promise<void> => {
    const provider = authManager.getAuthProvider(providerId);
    if (provider?.details?.auth?.type !== "device") {
        return;
    }

    const formData = new FormData();
    formData.append("client_id", provider.details.client.id);
    formData.append(
        "scopes",
        Array.isArray(provider.details.scopes) ? provider.details.scopes.join(" ") : provider.details.scopes
    );

    // Get the device auth request
    const response = await fetch(provider.authorizationUri, {
        method: "POST",
        body: formData
    });

    if (response.ok) {
        const deviceAuthData = await response.json();

        frontendCommunicator.send("device-code-received", {
            loginUrl: deviceAuthData.verification_uri,
            code: deviceAuthData.user_code
        });

        const tokenRequestData = new FormData();
        tokenRequestData.append("client_id", provider.details.client.id);
        tokenRequestData.append(
            "scopes",
            Array.isArray(provider.details.scopes) ? provider.details.scopes.join(" ") : provider.details.scopes
        );
        tokenRequestData.append("device_code", deviceAuthData.device_code);
        tokenRequestData.append("grant_type", "urn:ietf:params:oauth:grant-type:device_code");

        const tokenCheckInterval = setInterval(async () => {
            const tokenResponse = await fetch(provider.tokenUri, {
                method: "POST",
                body: tokenRequestData
            });

            if (tokenResponse.ok) {
                clearInterval(tokenCheckInterval);

                const tokenData = await tokenResponse.json();
                authManager.successfulAuth(providerId, tokenData);

                if (
                    Notification.isSupported() &&
                    windowManagement.mainWindow &&
                    !windowManagement.mainWindow.isFocused()
                ) {
                    const successfulAuthNotification = new Notification({
                        title: "Successfully authenticated with Twitch!",
                        body: "You can return to Firebot now."
                    });
                    successfulAuthNotification.show();
                    successfulAuthNotification.on("click", () => {
                        app.focus({
                            steal: true
                        });
                    });
                }
            }
        }, deviceAuthData.interval * 1000);

        frontendCommunicator.on("cancel-device-token-check", () => {
            if (tokenCheckInterval) {
                clearInterval(tokenCheckInterval);
            }
        });
    }
});

export = authManager;