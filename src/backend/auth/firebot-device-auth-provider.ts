import logger from "../logwrapper";
import accountAccess, { FirebotAccount } from "../common/account-access";
import twitchAuth from "./twitch-auth";
import TwitchApi from "../twitch-api/api";
import { AuthDetails, AuthProviderDefinition } from "./auth";
import { AccessToken, getExpiryDateOfAccessToken } from "@twurple/auth";
import { DeviceAuthProvider } from "./twitch-device-auth-provider";
import frontendCommunicator from "../common/frontend-communicator";

type ValidationRequest = {
    accountType: "streamer" | "bot";
    authDetails: AuthDetails;
}

class FirebotDeviceAuthProvider {
    streamerProvider: DeviceAuthProvider;
    botProvider: DeviceAuthProvider;

    private onRefresh(accountType: "streamer" | "bot", userId: string, token: AccessToken): void {
        const account: FirebotAccount = accountType === "streamer"
            ? accountAccess.getAccounts().streamer
            : accountAccess.getAccounts().bot;

        logger.debug(`Persisting ${accountType} access token`);

        const auth: AuthDetails = account.auth ?? { } as AuthDetails;
        auth.access_token = token.accessToken; // eslint-disable-line camelcase
        auth.refresh_token = token.refreshToken; // eslint-disable-line camelcase
        auth.expires_in = token.expiresIn; // eslint-disable-line camelcase
        auth.obtainment_timestamp = token.obtainmentTimestamp; // eslint-disable-line camelcase
        auth.expires_at = getExpiryDateOfAccessToken({ // eslint-disable-line camelcase
            expiresIn: token.expiresIn,
            obtainmentTimestamp: token.obtainmentTimestamp
        });

        account.auth = auth;
        accountAccess.updateAccount(accountType, account, false);
    }

    setupDeviceAuthProvider(): void {
        if (accountAccess.getAccounts().streamer.loggedIn) {
            const streamerAcccount = accountAccess.getAccounts().streamer;

            const scopes: string[] = Array.isArray(twitchAuth.streamerAccountProvider.scopes)
                ? twitchAuth.streamerAccountProvider.scopes
                : twitchAuth.streamerAccountProvider.scopes.split(" ");

            this.streamerProvider = new DeviceAuthProvider({
                userId: streamerAcccount.userId,
                clientId: twitchAuth.twitchClientId,
                accessToken: {
                    accessToken: streamerAcccount.auth.access_token,
                    refreshToken: streamerAcccount.auth.refresh_token,
                    expiresIn: streamerAcccount.auth.expires_in,
                    obtainmentTimestamp: streamerAcccount.auth.obtainment_timestamp ?? Date.now(),
                    scope: scopes
                }
            });

            this.streamerProvider.onRefresh((userId, token) => this.onRefresh("streamer", userId, token));
            this.streamerProvider.onRefreshFailure(() => accountAccess.setAccountTokenIssue("streamer"));
        } else {
            this.streamerProvider = null;
        }

        if (accountAccess.getAccounts().bot.loggedIn) {
            const botAcccount = accountAccess.getAccounts().bot;

            const scopes: string[] = Array.isArray(twitchAuth.botAccountProvider.scopes)
                ? twitchAuth.botAccountProvider.scopes
                : twitchAuth.botAccountProvider.scopes.split(" ");

            this.botProvider = new DeviceAuthProvider({
                userId: botAcccount.userId,
                clientId: twitchAuth.twitchClientId,
                accessToken: {
                    accessToken: botAcccount.auth.access_token,
                    refreshToken: botAcccount.auth.refresh_token,
                    expiresIn: botAcccount.auth.expires_in,
                    obtainmentTimestamp: botAcccount.auth.obtainment_timestamp ?? Date.now(),
                    scope: scopes
                }
            });

            this.botProvider.onRefresh((userId, token) => this.onRefresh("bot", userId, token));
            this.botProvider.onRefreshFailure(() => accountAccess.setAccountTokenIssue("bot"));
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

    async validateTwitchAccount(request: ValidationRequest): Promise<boolean> {
        let definition: AuthProviderDefinition;

        switch (request.accountType) {
            case "streamer":
                definition = twitchAuth.streamerAccountProvider;
                break;

            case "bot":
                definition = twitchAuth.botAccountProvider;
                break;

            default:
                break;
        }

        if (definition) {
            return this.isTwitchTokenDataValid(definition, request.authDetails);
        }

        return true;
    }

    async validateTwitchAccounts() {
        const invalidAccounts = {
            streamer: false,
            bot: false
        };

        if (accountAccess.getAccounts().streamer.loggedIn === true) {
            if (
                !(await this.validateTwitchAccount({
                    accountType: "streamer",
                    authDetails: accountAccess.getAccounts().streamer.auth
                }))
            ) {
                invalidAccounts.streamer = true;
            }
        }

        if (accountAccess.getAccounts().bot.loggedIn === true) {
            if (
                !(await this.validateTwitchAccount({
                    accountType: "bot",
                    authDetails: accountAccess.getAccounts().bot.auth
                }))
            ) {
                invalidAccounts.bot = true;
            }
        }

        frontendCommunicator.send("invalidate-accounts", invalidAccounts);
    }
}

const firebotDeviceAuthProvider = new FirebotDeviceAuthProvider();

accountAccess.events.on("account-update", () => {
    firebotDeviceAuthProvider.setupDeviceAuthProvider();
});

frontendCommunicator.onAsync("validate-twitch-accounts", async () => {
    await firebotDeviceAuthProvider.validateTwitchAccounts();
});

export = firebotDeviceAuthProvider;