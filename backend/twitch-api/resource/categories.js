"use strict";

const logger = require("../../logwrapper");
const twitchApi = require("../client");
const { TwitchAPICallType } = require("twitch/lib");

function mapTwitchGame(game, size) {
    if (game.box_art_url) {
        game.boxArtUrl = game.box_art_url.replace("{width}x{height}", size);
    }
    return game;
}

async function getCategoryById(gameId, size = "285x380") {
    const client = twitchApi.getClient();
    try {
        const game = await client.helix.games.getGameById(gameId);
        if (game == null) return null;
        return mapTwitchGame(game._data, size);
    } catch (error) {
        logger.error("Failed to get twitch game", error);
        return null;
    }
}

async function searchCategories(query) {
    const client = twitchApi.getClient();
    let games = [];
    try {
        const response = await client.callAPI({
            type: TwitchAPICallType.Helix,
            url: "search/categories",
            query: {
                query: query,
                first: 10
            }
        });
        if (response && response.data) {
            games = response.data;
        }
    } catch (err) {
        logger.error("Failed to search twitch categories", err);
    }
    return games.map(g => mapTwitchGame(g));
}

exports.getCategoryById = getCategoryById;
exports.searchCategories = searchCategories;