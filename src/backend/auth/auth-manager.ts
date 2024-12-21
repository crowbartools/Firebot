import { EventEmitter } from "events";
import ClientOAuth2 from "client-oauth2";
import logger from "../logwrapper";
import { AuthProvider, AuthProviderDefinition } from "./auth";
import { SettingsManager } from "../common/settings-manager";
import frontendCommunicator from "../common/frontend-communicator";
import { Notification, app } from "electron";
import windowManagement from "../app-management/electron/window-management";

class AuthManager extends EventEmitter {
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
        let scopes;
        if (provider.scopes) {
            scopes = Array.isArray(provider.scopes)
                ? (scopes = provider.scopes)
                : (scopes = provider.scopes.split(" "));
        } else {
            scopes = [];
        }

        const authUri = `${provider.auth.authorizeHost ?? provider.auth.tokenHost}${provider.auth.authorizePath}`;
        const tokenUri = `${provider.auth.tokenHost}${provider.auth.tokenPath ?? ""}`;

        return new ClientOAuth2({
            clientId: provider.client.id,
            clientSecret: provider.auth.type === "code" ? provider.client.secret : null,
            accessTokenUri: provider.auth.type === "token" ? null : tokenUri,
            authorizationUri: authUri,
            redirectUri: redirectUri,
            scopes: scopes,
            state: provider.id
        });
    }

    async refreshTokenIfExpired(providerId: string, tokenData: ClientOAuth2.Data): Promise<unknown> {
        const provider = this.getAuthProvider(providerId);
        let accessToken = provider.oauthClient.createToken(tokenData);

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
        return accessToken.data;
    }

    async revokeTokens(providerId: string, tokenData: ClientOAuth2.Data): Promise<void> {
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

    successfulAuth(providerId: string, tokenData: unknown): void {
        this.emit("auth-success", { providerId: providerId, tokenData: tokenData });
    }
}

const manager = new AuthManager();

frontendCommunicator.onAsync("begin-device-auth", async (providerId: string): Promise<void> => {
    const provider = manager.getAuthProvider(providerId);
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
                manager.successfulAuth(providerId, tokenData);

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

export = manager;