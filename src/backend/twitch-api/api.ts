import logger from "../logwrapper";
import accountAccess from "../common/account-access";
import firebotRefreshingAuthProvider from "../auth/firebot-refreshing-auth-provider";
import { ApiClient } from "@twurple/api";

class TwitchApi {
    client: ApiClient;

    setupApiClient(): void {
        if (accountAccess.getAccounts().streamer.loggedIn || accountAccess.getAccounts().bot.loggedIn) {
            if (!firebotRefreshingAuthProvider.provider) {
                return;
            }
    
            this.client = new ApiClient({ authProvider: firebotRefreshingAuthProvider.provider });
    
            logger.info("Finished setting up Twitch API client");
        }
    }

    getClient(): ApiClient {
        return this.client;
    }

    get bits() {
        return require("./resource/bits");
    }

    get categories() {
        return require("./resource/categories");
    }

    get channelRewards() {
        return require("./resource/channel-rewards");
    }

    get channels() {
        return require("./resource/channels");
    }

    get chat() {
        return require("./resource/chat");
    }

    get moderation() {
        return require("./resource/moderation");
    }

    get streams() {
        return require("./resource/streams");
    }

    get teams() {
        return require("./resource/teams");
    }

    get users() {
        return require("./resource/users");
    }

    get whispers() {
        return require("./resource/whispers");
    }
}

export = new TwitchApi();