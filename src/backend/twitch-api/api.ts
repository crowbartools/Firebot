import { ApiClient } from "@twurple/api";
import { AuthProvider } from "@twurple/auth";

import logger from "../logwrapper";
import accountAccess from "../common/account-access";

import { UserContextApiClient } from "./user-context-api-client";

import { TwitchAuthApi } from "./resource/auth";
import { TwitchBitsApi } from "./resource/bits";
import { TwitchCategoriesApi } from "./resource/categories";
import { TwitchChannelRewardsApi } from "./resource/channel-rewards";
import { TwitchChannelsApi } from "./resource/channels";
import { TwitchCharityApi } from "./resource/charity";
import { TwitchChatApi } from "./resource/chat";
import { TwitchGoalsApi } from "./resource/goals";
import { TwitchModerationApi } from "./resource/moderation";
import { TwitchPollsApi } from "./resource/polls";
import { TwitchPredictionsApi } from "./resource/predictions";
import { TwitchStreamsApi } from "./resource/streams";
import { TwitchSubscriptionsApi } from "./resource/subscriptions";
import { TwitchTeamsApi } from "./resource/teams";
import { TwitchUsersApi } from "./resource/users";
import { TwitchWhispersApi } from "./resource/whispers";

class TwitchApi {
    private _streamerClient: ApiClient;
    private _botClient: UserContextApiClient;

    setupApiClients(streamerProvider: AuthProvider, botProvider: AuthProvider): void {
        if (!streamerProvider && !botProvider) {
            return;
        }

        if (accountAccess.getAccounts().streamer.loggedIn) {
            this._streamerClient = new ApiClient({ authProvider: streamerProvider });
        }

        if (accountAccess.getAccounts().bot.loggedIn) {
            this._botClient = new UserContextApiClient(
                { authProvider: botProvider },
                accountAccess.getAccounts().bot.userId
            );
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

    get auth() {
        return new TwitchAuthApi(this._streamerClient, this._botClient);
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

    get charity() {
        return new TwitchCharityApi(this._streamerClient, this._botClient);
    }

    get chat() {
        return new TwitchChatApi(this._streamerClient, this._botClient);
    }

    get goals() {
        return new TwitchGoalsApi(this._streamerClient, this._botClient);
    }

    get moderation() {
        return new TwitchModerationApi(this._streamerClient, this._botClient);
    }

    get polls() {
        return new TwitchPollsApi(this._streamerClient, this._botClient);
    }

    get predictions() {
        return new TwitchPredictionsApi(this._streamerClient, this._botClient);
    }

    get streams() {
        return new TwitchStreamsApi(this._streamerClient, this._botClient);
    }

    get subscriptions() {
        return new TwitchSubscriptionsApi(this._streamerClient, this._botClient);
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

export = new TwitchApi();