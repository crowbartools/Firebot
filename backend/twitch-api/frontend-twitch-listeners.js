"use strict";

const twitchCategories = require("./resource/categories");
const channelRewards = require("./resource/channel-rewards");
const frontendCommunicator = require("../common/frontend-communicator");

exports.setupListeners = () => {

    frontendCommunicator.onAsync("search-twitch-games", query => {
        return twitchCategories.searchCategories(query);
    });

    frontendCommunicator.onAsync("get-twitch-game", gameId => {
        return twitchCategories.getCategoryById(gameId);
    });

    frontendCommunicator.onAsync("get-channel-rewards", () => {
        return channelRewards.getCustomChannelRewards();
    });

};