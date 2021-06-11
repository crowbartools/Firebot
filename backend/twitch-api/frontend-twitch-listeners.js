"use strict";

const twitchCategories = require("./resource/categories");
const channelRewards = require("./resource/channel-rewards");
const channels = require("./resource/channels");
const frontendCommunicator = require("../common/frontend-communicator");

exports.setupListeners = () => {

    frontendCommunicator.onAsync("search-twitch-games", query => {
        return twitchCategories.searchCategories(query);
    });

    frontendCommunicator.onAsync("get-twitch-game", gameId => {
        return twitchCategories.getCategoryById(gameId);
    });

    frontendCommunicator.onAsync("get-channel-info", async () => {
        try {
            const channelInfo = await channels.getChannelInformation();
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
            await channels.updateChannelInformation(title, gameId);
            return true;
        } catch (error) {
            return false;
        }
    });

    frontendCommunicator.onAsync("get-channel-rewards", async () => {
        const rewards = await channelRewards.getCustomChannelRewards();
        return rewards || [];
    });

};