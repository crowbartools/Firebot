"use strict";

const gameManager = require("./game-manager");

exports.loadGames = () => {
    [
        'bid',
        'heist',
        'slots',
        'trivia'
    ].forEach((gameName) => {
        const definition = require(`./builtin/${gameName}/${gameName}`).default;
        gameManager.registerGame(definition);
    });
};
