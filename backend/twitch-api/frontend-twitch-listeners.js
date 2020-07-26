"use strict";

const twitchApi = require("./client");

const frontendCommunicator = require("../common/frontend-communicator");

exports.setupListeners = () => {
    const client = twitchApi.getClient();

    frontendCommunicator.onAsync("search-twitch-games", async query => {
        // query twitch api with client, return list of games
    });
};