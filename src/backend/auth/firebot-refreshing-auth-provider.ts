import logger from "../logwrapper";
import accountAccess, { AuthDetails, FirebotAccount } from "../common/account-access";
import twitchAuth from "./twitch-auth";
import TwitchApi = require("../twitch-api/api");
import { getExpiryDateOfAccessToken, RefreshingAuthProvider } from "@twurple/auth";

class FirebotRefreshingAuthProvider {
    provider: RefreshingAuthProvider;

    STREAMER_CHAT_INTENT: string = "chat:streamer";
    BOT_CHAT_INTENT: string = "chat:bot";

    setupRefreshingAuthProvider(): void {
        this.provider = new RefreshingAuthProvider({
            clientId: twitchAuth.TWITCH_CLIENT_ID,
            clientSecret: twitchAuth.TWITCH_CLIENT_SECRET,
            onRefresh: (userId, token) => {
                let account: FirebotAccount;
                let accountType: "streamer" | "bot";
    
                if (accountAccess.getAccounts().bot?.userId === userId) {
                    account = accountAccess.getAccounts().bot;
                    accountType = "bot";
                } else if (accountAccess.getAccounts().streamer?.userId === userId) {
                    account = accountAccess.getAccounts().streamer;
                    accountType = "streamer";
                } else {
                    logger.warn("Unknown Twitch account token refreshed");
                }
    
                logger.debug(`Persisting ${accountType} access token`);
    
                const auth: AuthDetails = account.auth ?? { } as AuthDetails;
                auth.access_token = token.accessToken;
                auth.refresh_token = token.refreshToken;
                auth.expires_in = token.expiresIn;
                auth.obtainment_timestamp = token.obtainmentTimestamp;
                auth.expires_at = getExpiryDateOfAccessToken({
                    expiresIn: token.expiresIn,
                    obtainmentTimestamp: token.obtainmentTimestamp
                });
    
                account.auth = auth;
                accountAccess.updateAccount(accountType, account, false);
            }
        });
    
        if (accountAccess.getAccounts().streamer.loggedIn) {
            const streamerAcccount = accountAccess.getAccounts().streamer;
    
            this.provider.addUser(streamerAcccount.userId, {
                accessToken: streamerAcccount.auth.access_token,
                refreshToken: streamerAcccount.auth.refresh_token,
                expiresIn: streamerAcccount.auth.expires_in,
                obtainmentTimestamp: streamerAcccount.auth.obtainment_timestamp,
                scope: twitchAuth.STREAMER_ACCOUNT_PROVIDER.scopes.split(" ")
            }, [ this.STREAMER_CHAT_INTENT ]);
        }
    
        if (accountAccess.getAccounts().bot.loggedIn) {
            const botAcccount = accountAccess.getAccounts().bot;
            
            this.provider.addUser(botAcccount.userId, {
                accessToken: botAcccount.auth.access_token,
                refreshToken: botAcccount.auth.refresh_token,
                expiresIn: botAcccount.auth.expires_in,
                obtainmentTimestamp: botAcccount.auth.obtainment_timestamp,
                scope: twitchAuth.BOT_ACCOUNT_PROVIDER.scopes.split(" ")
            }, [ this.BOT_CHAT_INTENT ]);
        }

        if (this.provider) {
            TwitchApi.setupApiClient(this.provider);
        }
    }
}

const firebotRefreshingAuthProvider = new FirebotRefreshingAuthProvider();

accountAccess.events.on("account-update", () => {
    firebotRefreshingAuthProvider.setupRefreshingAuthProvider();
});

export = firebotRefreshingAuthProvider;