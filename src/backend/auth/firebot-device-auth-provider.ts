import { AccessToken, getExpiryDateOfAccessToken } from "@twurple/auth";

import { AuthDetails, AuthProviderDefinition } from "../../types/auth";

import { AccountAccess } from "../common/account-access";
import { DeviceAuthProvider } from "../streaming-platforms/twitch/auth/twitch-device-auth-provider";
import { TwitchApi } from "../streaming-platforms/twitch/api";
import { TwitchAuthProviders } from "../streaming-platforms/twitch/auth/twitch-auth";
import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";

type ValidationRequest = {
    accountType: "streamer" | "bot";
    authDetails: AuthDetails;
};

class FirebotDeviceAuthProvider {
    streamerProvider: DeviceAuthProvider;
    botProvider: DeviceAuthProvider;

    private onRefresh(accountType: "streamer" | "bot", userId: string, token: AccessToken): void {
        const account = accountType === "streamer"
            ? AccountAccess.getAccounts().streamer
            : AccountAccess.getAccounts().bot;

        logger.debug(`Persisting ${accountType} access token`);

        const auth = (account.auth ?? {}) as AuthDetails;
        auth.access_token = token.accessToken; // eslint-disable-line camelcase
        auth.refresh_token = token.refreshToken; // eslint-disable-line camelcase
        auth.expires_in = token.expiresIn; // eslint-disable-line camelcase
        auth.obtainment_timestamp = token.obtainmentTimestamp; // eslint-disable-line camelcase
        auth.expires_at = getExpiryDateOfAccessToken({ // eslint-disable-line camelcase
            expiresIn: token.expiresIn,
            obtainmentTimestamp: token.obtainmentTimestamp
        });

        account.auth = auth;
        AccountAccess.updateAccount(accountType, account, false, true);
    }

    setupDeviceAuthProvider(): void {
        if (AccountAccess.getAccounts().streamer.loggedIn) {
            const streamerAcccount = AccountAccess.getAccounts().streamer;

            const scopes = Array.isArray(TwitchAuthProviders.streamerAccountProvider.scopes)
                ? TwitchAuthProviders.streamerAccountProvider.scopes
                : TwitchAuthProviders.streamerAccountProvider.scopes.split(" ");

            this.streamerProvider = new DeviceAuthProvider({
                userId: streamerAcccount.userId,
                clientId: TwitchAuthProviders.twitchClientId,
                accessToken: {
                    accessToken: streamerAcccount.auth.access_token,
                    refreshToken: streamerAcccount.auth.refresh_token,
                    expiresIn: streamerAcccount.auth.expires_in,
                    obtainmentTimestamp: streamerAcccount.auth.obtainment_timestamp ?? Date.now(),
                    scope: scopes
                }
            });

            this.streamerProvider.onRefresh((userId, token) => this.onRefresh("streamer", userId, token));
            this.streamerProvider.onRefreshFailure((_userId, isENotFoundError) => {
                if (isENotFoundError) {
                    return;
                }
                AccountAccess.setAccountTokenIssue("streamer");
            });
        } else {
            this.streamerProvider = null;
        }

        if (AccountAccess.getAccounts().bot.loggedIn) {
            const botAcccount = AccountAccess.getAccounts().bot;

            const scopes: string[] = Array.isArray(TwitchAuthProviders.botAccountProvider.scopes)
                ? TwitchAuthProviders.botAccountProvider.scopes
                : TwitchAuthProviders.botAccountProvider.scopes.split(" ");

            this.botProvider = new DeviceAuthProvider({
                userId: botAcccount.userId,
                clientId: TwitchAuthProviders.twitchClientId,
                accessToken: {
                    accessToken: botAcccount.auth.access_token,
                    refreshToken: botAcccount.auth.refresh_token,
                    expiresIn: botAcccount.auth.expires_in,
                    obtainmentTimestamp: botAcccount.auth.obtainment_timestamp ?? Date.now(),
                    scope: scopes
                }
            });

            this.botProvider.onRefresh((userId, token) => this.onRefresh("bot", userId, token));
            this.botProvider.onRefreshFailure((_userId, isENotFoundError) => {
                if (isENotFoundError) {
                    return;
                }
                AccountAccess.setAccountTokenIssue("bot");
            });
        } else {
            this.botProvider = null;
        }

        TwitchApi.setupApiClients(this.streamerProvider, this.botProvider);
    }

    isTwitchTokenDataValid(definition: AuthProviderDefinition, authDetails: AuthDetails): boolean {
        const scopes = Array.isArray(definition.scopes)
            ? definition.scopes
            : definition.scopes.split(" ");

        return (
            // Ensure authDetails exist
            authDetails &&

            // Make sure we have a refresh token
            authDetails.refresh_token &&

            // Make sure there's at least some scopes
            authDetails.scope &&
            authDetails.scope.length > 0 &&

            // check all required scopes are present
            scopes.every(scope => authDetails.scope.includes(scope))
        );
    }

    validateTwitchAccount(request: ValidationRequest): boolean {
        let definition: AuthProviderDefinition;

        switch (request.accountType) {
            case "streamer":
                definition = TwitchAuthProviders.streamerAccountProvider;
                break;

            case "bot":
                definition = TwitchAuthProviders.botAccountProvider;
                break;

            default:
                break;
        }

        if (definition) {
            return this.isTwitchTokenDataValid(definition, request.authDetails);
        }

        return true;
    }

    validateTwitchAccounts() {
        const invalidAccounts = {
            streamer: false,
            bot: false
        };

        if (AccountAccess.getAccounts().streamer.loggedIn === true) {
            if (
                !(this.validateTwitchAccount({
                    accountType: "streamer",
                    authDetails: AccountAccess.getAccounts().streamer.auth
                }))
            ) {
                invalidAccounts.streamer = true;
            }
        }

        if (AccountAccess.getAccounts().bot.loggedIn === true) {
            if (
                !(this.validateTwitchAccount({
                    accountType: "bot",
                    authDetails: AccountAccess.getAccounts().bot.auth
                }))
            ) {
                invalidAccounts.bot = true;
            }
        }

        frontendCommunicator.send("accounts:invalidate-accounts", invalidAccounts);
    }
}

const firebotDeviceAuthProvider = new FirebotDeviceAuthProvider();

AccountAccess.on("account-update", () => {
    firebotDeviceAuthProvider.setupDeviceAuthProvider();
});

frontendCommunicator.on("validate-twitch-accounts", () => {
    firebotDeviceAuthProvider.validateTwitchAccounts();
});

export { firebotDeviceAuthProvider as FirebotDeviceAuthProvider };