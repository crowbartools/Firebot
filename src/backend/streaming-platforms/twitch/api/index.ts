import {
    ApiClient,
    type HelixChannelUpdate,
    type HelixUser
} from "@twurple/api";
import type { AuthProvider } from "@twurple/auth";

import type { FirebotAccount } from "../../../../types/accounts";

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
import { TwitchScheduleApi } from "./resource/schedule";
import { TwitchStreamsApi } from "./resource/streams";
import { TwitchSubscriptionsApi } from "./resource/subscriptions";
import { TwitchTeamsApi } from "./resource/teams";
import { TwitchUsersApi } from "./resource/users";
import { TwitchVideosApi } from "./resource/videos";
import { TwitchWhispersApi } from "./resource/whispers";

import { UserContextApiClient } from "./user-context-api-client";
import { AccountAccess } from "../../../common/account-access";
import { SettingsManager } from "../../../common/settings-manager";
import frontendCommunicator from "../../../common/frontend-communicator";
import logger from "../../../logwrapper";

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

    private async refreshAccountData(accountType: "streamer" | "bot"): Promise<FirebotAccount> {
        const account = accountType === "streamer"
            ? AccountAccess.getAccounts().streamer
            : AccountAccess.getAccounts().bot;

        let data: HelixUser;
        try {
            data = await this.users.getUserById(account.userId);
        } catch (error) {
            logger.warn("[accounts.getTwitchData] Failed to get account data", (error as Error).message);
            return account;
        }

        account.username = data.name;
        account.displayName = data.displayName;
        account.avatar = data.profilePictureUrl;

        if (accountType === "streamer") {
            account.broadcasterType = data.broadcasterType;
        }

        return account;
    }

    async refreshAccounts(): Promise<void> {
        const accounts = AccountAccess.getAccounts();

        if (accounts.streamer?.loggedIn) {
            accounts.streamer = await this.refreshAccountData("streamer");
            AccountAccess.updateAccount("streamer", accounts.streamer);
        }

        if (accounts.bot?.loggedIn) {
            accounts.bot = await this.refreshAccountData("bot");
            AccountAccess.updateAccount("bot", accounts.bot);
        }
    }

    setupApiClients(streamerProvider: AuthProvider, botProvider: AuthProvider): void {
        logger.debug("Call to setupApiClients");

        if (!streamerProvider && !botProvider) {
            return;
        }

        if (AccountAccess.getAccounts().streamer.loggedIn) {
            this._streamerClient = new ApiClient({ authProvider: streamerProvider });
        }

        if (AccountAccess.getAccounts().bot.loggedIn) {
            this._botClient = new UserContextApiClient(
                { authProvider: botProvider },
                AccountAccess.getAccounts().bot.userId
            );
        }

        logger.info("Finished setting up Twitch API clients");
    }

    /**
     * @deprecated Use the {@linkcode streamerClient} and {@linkcode botClient} properties going forward
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

    get moderationClient(): ApiClient {
        const modUser = SettingsManager.getSetting("DefaultModerationUser");
        return modUser === "bot" && this.accounts.bot.loggedIn === true && this._botClient
            ? this.botClient
            : this.streamerClient;
    }

    get accounts() {
        return AccountAccess.getAccounts();
    }

    get logger() {
        return logger;
    }

    private _auth: TwitchAuthApi;
    get auth() {
        return this._auth ??= new TwitchAuthApi(this);
    }

    private _bits: TwitchBitsApi;
    get bits() {
        return this._bits ??= new TwitchBitsApi(this);
    }

    private _categories: TwitchCategoriesApi;
    get categories() {
        return this._categories ??= new TwitchCategoriesApi(this);
    }

    private _channelRewards: TwitchChannelRewardsApi;
    get channelRewards() {
        return this._channelRewards ??= new TwitchChannelRewardsApi(this);
    }

    private _channels: TwitchChannelsApi;
    get channels() {
        return this._channels ??= new TwitchChannelsApi(this);
    }

    private _charity: TwitchCharityApi;
    get charity() {
        return this._charity ??= new TwitchCharityApi(this);
    }

    private _chat: TwitchChatApi;
    get chat() {
        return this._chat ??= new TwitchChatApi(this);
    }

    private _clips: TwitchClipsApi;
    get clips() {
        return this._clips ??= new TwitchClipsApi(this);
    }

    private _goals: TwitchGoalsApi;
    get goals() {
        return this._goals ??= new TwitchGoalsApi(this);
    }

    private _hypeTrain: TwitchHypeTrainApi;
    get hypeTrain() {
        return this._hypeTrain ??= new TwitchHypeTrainApi(this);
    }

    private _moderation: TwitchModerationApi;
    get moderation() {
        return this._moderation ??= new TwitchModerationApi(this);
    }

    private _polls: TwitchPollsApi;
    get polls() {
        return this._polls ??= new TwitchPollsApi(this);
    }

    private _preditions: TwitchPredictionsApi;
    get predictions() {
        return this._preditions ??= new TwitchPredictionsApi(this);
    }

    private _schedule: TwitchScheduleApi;
    get schedule() {
        return this._schedule ??= new TwitchScheduleApi(this);
    }

    private _streams: TwitchStreamsApi;
    get streams() {
        return this._streams ??= new TwitchStreamsApi(this);
    }

    private _subscriptions: TwitchSubscriptionsApi;
    get subscriptions() {
        return this._subscriptions ??= new TwitchSubscriptionsApi(this);
    }

    private _teams: TwitchTeamsApi;
    get teams() {
        return this._teams ??= new TwitchTeamsApi(this);
    }

    private _users: TwitchUsersApi;
    get users() {
        return this._users ??= new TwitchUsersApi(this);
    }

    private _videos: TwitchVideosApi;
    get videos() {
        return this._videos ??= new TwitchVideosApi(this);
    }

    private _whispers: TwitchWhispersApi;
    get whispers() {
        return this._whispers ??= new TwitchWhispersApi(this);
    }
}

const twitchApi = new TwitchApi();

export { twitchApi as TwitchApi };