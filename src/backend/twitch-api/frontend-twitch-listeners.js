"use strict";

const twitchApi = require("./api");
const frontendCommunicator = require("../common/frontend-communicator");
const logger = require("../logwrapper");

exports.setupListeners = () => {

    frontendCommunicator.onAsync("search-twitch-games", query => {
        return twitchApi.categories.searchCategories(query);
    });

    frontendCommunicator.onAsync("search-twitch-channels", async query => {
        const response = await twitchApi.getClient().search.searchChannels(query, { limit: 10 });
        return (response?.data ?? []).map(c => ({
            id: c.id,
            username: c.displayName,
            avatarUrl: c.thumbnailUrl
        }));
    });

    frontendCommunicator.onAsync("process-automod-message", async data => {
        const accountAccess = require("../common/account-access");
        const streamerChannelId = accountAccess.getAccounts().streamer.channelId;
        try {
            await twitchApi.getClient().moderation.processHeldAutoModMessage(streamerChannelId, data.messageId, data.allow);
        } catch (error) {
            const likelyExpired = error?.body?.includes("attempted to update a message status that was either already set");
            frontendCommunicator.send("twitch:chat:automod-update-error", { messageId: data.messageId, likelyExpired });
            logger.error(error);
        }
    });

    frontendCommunicator.onAsync("get-twitch-game", async (gameId) => {
        return await twitchApi.categories.getCategoryById(gameId);
    });

    frontendCommunicator.onAsync("get-channel-stream-tags", async () => {
        return await twitchApi.streamTags.getChannelStreamTags();
    });

    frontendCommunicator.onAsync("get-all-stream-tags", async () => {
        return await twitchApi.streamTags.getAllStreamTags();
    });

    frontendCommunicator.onAsync("get-channel-info", async () => {
        try {
            const channelInfo = await twitchApi.channels.getChannelInformation();
            return {
                title: channelInfo.title,
                gameId: channelInfo.gameId
            };
        } catch (error) {
            return null;
        }
    });

    frontendCommunicator.onAsync("set-channel-info", async ({ title, gameId }) => {
        try {
            await twitchApi.channels.updateChannelInformation({ title, gameId });
            return true;
        } catch (error) {
            return false;
        }
    });

    frontendCommunicator.onAsync("set-stream-tags", async (tagIds) => {
        try {
            await twitchApi.streamTags.updateChannelStreamTags(tagIds);
            return true;
        } catch (error) {
            return false;
        }
    });

    frontendCommunicator.onAsync("get-channel-rewards", async () => {
        const rewards = await twitchApi.channelRewards.getCustomChannelRewards();
        return rewards || [];
    });
};