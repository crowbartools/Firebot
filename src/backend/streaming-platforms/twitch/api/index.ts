import { ApiClient, HelixChannelUpdate } from "@twurple/api";
import { AuthProvider } from "@twurple/auth";

import { UserContextApiClient } from "./user-context-api-client";

import { TwitchAuthApi } from "./resource/auth";
import { TwitchBitsApi } from "./resource/bits";
import { TwitchCategoriesApi } from "./resource/categories";
import { TwitchChannelRewardsApi } from "./resource/channel-rewards";
import { TwitchChannelsApi } from "./resource/channels";
import { TwitchCharityApi } from "./resource/charity";
import { TwitchChatApi } from "./resource/chat";
import { TwitchClipsApi } from "./resource/clips";
import { TwitchGoalsApi } from "./resource/goals";
import { TwitchHypeTrainApi } from "./resource/hypetrain";
import { TwitchModerationApi } from "./resource/moderation";
import { TwitchPollsApi } from "./resource/polls";
import { TwitchPredictionsApi } from "./resource/predictions";
import { TwitchStreamsApi } from "./resource/streams";
import { TwitchSubscriptionsApi } from "./resource/subscriptions";
import { TwitchTeamsApi } from "./resource/teams";
import { TwitchUsersApi } from "./resource/users";
import { TwitchWhispersApi } from "./resource/whispers";

import logger from "../../../logwrapper";
import accountAccess from "../../../common/account-access";
import frontendCommunicator from "../../../common/frontend-communicator";

class TwitchApi {
    private _streamerClient: ApiClient;
    private _botClient: UserContextApiClient;

    constructor() {
        frontendCommunicator.onAsync("search-twitch-games", (query: string) =>
            this.categories.searchCategories(query)
        );

        frontendCommunicator.onAsync("search-twitch-channels", async (query: string) => {
            const response = await this._streamerClient.search.searchChannels(query, { limit: 10 });
            return (response?.data ?? []).map(c => ({
                id: c.id,
                username: c.name,
                displayName: c.displayName,
                avatarUrl: c.thumbnailUrl
            }));
        });

        frontendCommunicator.onAsync("process-automod-message", async ({ messageId, allow }: { messageId: string, allow: boolean }) =>
            await this.moderation.processHeldAutoModMessage(messageId, allow)
        );

        frontendCommunicator.onAsync("get-twitch-game", async (gameId: string) =>
            await this.categories.getCategoryById(gameId)
        );

        frontendCommunicator.onAsync("get-channel-info", async () => {
            try {
                const channelInfo = await this.channels.getChannelInformation();
                return {
                    title: channelInfo.title,
                    gameId: channelInfo.gameId,
                    tags: channelInfo.tags
                };
            } catch {
                return null;
            }
        });

        frontendCommunicator.onAsync("set-channel-info", async (data: HelixChannelUpdate) => {
            try {
                await this.channels.updateChannelInformation(data);
                return true;
            } catch {
                return false;
            }
        });

        frontendCommunicator.onAsync("get-channel-rewards", async () => {
            const rewards = await this.channelRewards.getCustomChannelRewards();
            return rewards || [];
        });
    }

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

    private _auth: TwitchAuthApi;
    get auth() {
        return this._auth ??= new TwitchAuthApi(this._streamerClient, this._botClient);
    }

    private _bits: TwitchBitsApi;
    get bits() {
        return this._bits ??= new TwitchBitsApi(this._streamerClient, this._botClient);
    }

    private _categories: TwitchCategoriesApi;
    get categories() {
        return this._categories ??= new TwitchCategoriesApi(this._streamerClient, this._botClient);
    }

    private _channelRewards: TwitchChannelRewardsApi;
    get channelRewards() {
        return this._channelRewards ??= new TwitchChannelRewardsApi(this._streamerClient, this._botClient);
    }

    private _channels: TwitchChannelsApi;
    get channels() {
        return this._channels ??= new TwitchChannelsApi(this._streamerClient, this._botClient);
    }

    private _charity: TwitchCharityApi;
    get charity() {
        return this._charity ??= new TwitchCharityApi(this._streamerClient, this._botClient);
    }

    private _chat: TwitchChatApi;
    get chat() {
        return this._chat ??= new TwitchChatApi(this._streamerClient, this._botClient);
    }

    private _clips: TwitchClipsApi;
    get clips() {
        return this._clips ??= new TwitchClipsApi(this._streamerClient, this._botClient);
    }

    private _goals: TwitchGoalsApi;
    get goals() {
        return this._goals ??= new TwitchGoalsApi(this._streamerClient, this._botClient);
    }

    private _moderation: TwitchModerationApi;
    get moderation() {
        return this._moderation ??= new TwitchModerationApi(this._streamerClient, this._botClient);
    }

    private _polls: TwitchPollsApi;
    get polls() {
        return this._polls ??= new TwitchPollsApi(this._streamerClient, this._botClient);
    }

    private _preditions: TwitchPredictionsApi;
    get predictions() {
        return this._preditions ??= new TwitchPredictionsApi(this._streamerClient, this._botClient);
    }

    private _hypeTrain: TwitchHypeTrainApi;
    get hypeTrain() {
        return this._hypeTrain ??= new TwitchHypeTrainApi(this._streamerClient, this._botClient);
    }

    private _streams: TwitchStreamsApi;
    get streams() {
        return this._streams ??= new TwitchStreamsApi(this._streamerClient, this._botClient);
    }

    private _subscriptions: TwitchSubscriptionsApi;
    get subscriptions() {
        return this._subscriptions ??= new TwitchSubscriptionsApi(this._streamerClient, this._botClient);
    }

    private _teams: TwitchTeamsApi;
    get teams() {
        return this._teams ??= new TwitchTeamsApi(this._streamerClient, this._botClient);
    }

    private _users: TwitchUsersApi;
    get users() {
        return this._users ??= new TwitchUsersApi(this._streamerClient, this._botClient);
    }

    private _whispers: TwitchWhispersApi;
    get whispers() {
        return this._whispers ??= new TwitchWhispersApi(this._streamerClient, this._botClient);
    }
}

const twitchApi = new TwitchApi();

export { twitchApi as TwitchApi };