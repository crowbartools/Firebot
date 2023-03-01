import { ApiClient } from "@twurple/api";
import { StaticAuthProvider } from "@twurple/auth";

import logger from "../logwrapper";
import accountAccess from "../common/account-access";

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
    private _streamerClient: ApiClient;
    private _botClient: ApiClient;

    setupApiClients(streamerProvider: StaticAuthProvider, botProvider: StaticAuthProvider): void {
        if (!streamerProvider && !botProvider) {
            return;
        }

        if (accountAccess.getAccounts().streamer.loggedIn) {
            this._streamerClient = new ApiClient({ authProvider: streamerProvider });
        }
        
        if (accountAccess.getAccounts().bot.loggedIn) {
            this._botClient = new ApiClient({ authProvider: botProvider });
        }
    
        logger.info("Finished setting up Twitch API client");
    }

    /**
     * @deprecated Use the `streamerClient` and `botClient` properties going forward
     */
    getClient(): ApiClient {
        return this.streamerClient;
    }

    get streamerClient(): ApiClient {
        return this._streamerClient;
    }

    get botClient(): ApiClient {
        return this._botClient;
    }

    get bits() {
        return new TwitchBitsApi(this._streamerClient, this._botClient);
    }

    get categories() {
        return new TwitchCategoriesApi(this._streamerClient, this._botClient);
    }

    get channelRewards() {
        return new TwitchChannelRewardsApi(this._streamerClient, this._botClient);
    }

    get channels() {
        return new TwitchChannelsApi(this._streamerClient, this._botClient);
    }

    get chat() {
        return new TwitchChatApi(this._streamerClient, this._botClient);
    }

    get moderation() {
        return new TwitchModerationApi(this._streamerClient, this._botClient);
    }

    get streams() {
        return new TwitchStreamsApi(this._streamerClient, this._botClient);
    }

    get teams() {
        return new TwitchTeamsApi(this._streamerClient, this._botClient);
    }

    get users() {
        return new TwitchUsersApi(this._streamerClient, this._botClient);
    }

    get whispers() {
        return new TwitchWhispersApi(this._streamerClient, this._botClient);
    }
}

export = new TwitchApi();;