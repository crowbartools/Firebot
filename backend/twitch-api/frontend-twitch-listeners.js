"use strict";

const twitchApi = require("./api");
const frontendCommunicator = require("../common/frontend-communicator");

exports.setupListeners = () => {

    frontendCommunicator.onAsync("search-twitch-games", query => {
        return twitchApi.categories.searchCategories(query);
    });

    frontendCommunicator.onAsync("get-twitch-game", gameId => {
        return twitchApi.categories.getCategoryById(gameId);
    });

    frontendCommunicator.onAsync("get-channel-stream-tags", () => {
        return twitchApi.streamTags.getChannelStreamTags();
    });

    frontendCommunicator.onAsync("get-all-stream-tags", () => {
        return twitchApi.streamTags.getAllStreamTagsPaginated();
    });

    frontendCommunicator.onAsync("get-channel-info", async () => {
        try {
            const channelInfo = await twitchApi.channels.getChannelInformation();
            return {
                title: channelInfo.title,
                gameId: channelInfo.game_id
            };
        } catch (error) {
            return null;
        }
    });

    frontendCommunicator.onAsync("set-channel-info", async ({ title, gameId }) => {
        try {
            await twitchApi.channels.updateChannelInformation(title, gameId);
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