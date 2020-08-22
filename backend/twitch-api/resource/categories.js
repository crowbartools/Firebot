"use strict";

const logger = require("../../logwrapper");
const twitchApi = require("../client");
const { TwitchAPICallType } = require("twitch/lib");

function mapTwitchGame(game) {
    if (game.box_art_url) {
        game.boxArtUrl = game.box_art_url.replace("{width}x{height}", "285x380");
    }
    return game;
}

async function getCategoryById(gameId) {
    const client = twitchApi.getClient();
    try {
        const game = await client.helix.games.getGameById(gameId);
        return mapTwitchGame(game._data);
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