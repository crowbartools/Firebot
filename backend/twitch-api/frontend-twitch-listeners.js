"use strict";

const twitchCategories = require("./resource/categories");
const frontendCommunicator = require("../common/frontend-communicator");

exports.setupListeners = () => {

    frontendCommunicator.onAsync("search-twitch-games", query => {
        return twitchCategories.searchCategories(query);
    });

    frontendCommunicator.onAsync("get-twitch-game", gameId => {
        return twitchCategories.getCategoryById(gameId);
    });

};