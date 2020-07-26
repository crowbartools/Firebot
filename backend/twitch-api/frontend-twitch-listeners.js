"use strict";

const twitchApi = require("./client");

const frontendCommunicator = require("../common/frontend-communicator");

exports.setupListeners = () => {
    const client = twitchApi.getClient();

    frontendCommunicator.onAsync("search-twitch-games", async query => {
        let games = await client.helix.games.getGameByName(query);
        if (games != null) {
            return games._data;
        }
        return;
    });
};