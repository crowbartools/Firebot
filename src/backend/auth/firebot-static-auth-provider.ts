import accountAccess from "../common/account-access";
import twitchAuth from "./twitch-auth";
import TwitchApi from "../twitch-api/api";
import { StaticAuthProvider } from "@twurple/auth";

class FirebotStaticAuthProvider {
    streamerProvider: StaticAuthProvider;
    botProvider: StaticAuthProvider;

    setupStaticAuthProvider(): void {
        if (accountAccess.getAccounts().streamer.loggedIn) {
            const streamerAcccount = accountAccess.getAccounts().streamer;

            this.streamerProvider = new StaticAuthProvider(
                twitchAuth.TWITCH_CLIENT_ID,
                streamerAcccount.auth.access_token,
                twitchAuth.STREAMER_ACCOUNT_PROVIDER.scopes as string[]
            );
        } else {
            this.streamerProvider = null;
        }

        if (accountAccess.getAccounts().bot.loggedIn) {
            const botAcccount = accountAccess.getAccounts().bot;

            this.botProvider = new StaticAuthProvider(
                twitchAuth.TWITCH_CLIENT_ID,
                botAcccount.auth.access_token,
                twitchAuth.BOT_ACCOUNT_PROVIDER.scopes as string[]
            );
        } else {
            this.botProvider = null;
        }

        TwitchApi.setupApiClients(this.streamerProvider, this.botProvider);
    }
}

const firebotStaticAuthProvider = new FirebotStaticAuthProvider();

accountAccess.events.on("account-update", () => {
    firebotStaticAuthProvider.setupStaticAuthProvider();
});

export = firebotStaticAuthProvider;