import logger from "../logwrapper";
import accountAccess from "../common/account-access";
import { ApiClient } from "@twurple/api";
import { RefreshingAuthProvider } from "@twurple/auth";

import { TwitchBitsApi } from "./resource/bits";
import { TwitchCategoriesApi } from "./resource/categories";
import { TwitchChannelRewardsApi } from "./resource/channel-rewards";
import { TwitchChannelsApi } from "./resource/channels";
import { TwitchChatApi } from "./resource/chat";
import { TwitchModerationApi } from "./resource/moderation";
import { TwitchStreamsApi } from "./resource/streams";
import { TwitchTeamsApi } from "./resource/teams";
import { TwitchUsersApi } from "./resource/users";
import { TwitchWhispersApi } from "./resource/whispers";

class TwitchApi {
    client: ApiClient;

    setupApiClient(provider: RefreshingAuthProvider): void {
        if (accountAccess.getAccounts().streamer.loggedIn || accountAccess.getAccounts().bot.loggedIn) {
            if (!provider) {
                return;
            }
    
            this.client = new ApiClient({ authProvider: provider });
    
            logger.info("Finished setting up Twitch API client");
        }
    }

    getClient(): ApiClient {
        return this.client;
    }

    get bits() {
        return new TwitchBitsApi(this.client);
    }

    get categories() {
        return new TwitchCategoriesApi(this.client);
    }

    get channelRewards() {
        return new TwitchChannelRewardsApi(this.client);
    }

    get channels() {
        return new TwitchChannelsApi(this.client);
    }

    get chat() {
        return new TwitchChatApi(this.client);
    }

    get moderation() {
        return new TwitchModerationApi(this.client);
    }

    get streams() {
        return new TwitchStreamsApi(this.client);
    }

    get teams() {
        return new TwitchTeamsApi(this.client);
    }

    get users() {
        return new TwitchUsersApi(this.client);
    }

    get whispers() {
        return new TwitchWhispersApi(this.client);
    }
}

export = new TwitchApi();;