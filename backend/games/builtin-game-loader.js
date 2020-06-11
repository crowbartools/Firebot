"use strict";

const gameManager = require("./game-manager");

exports.loadGames = () => {
    gameManager.registerGame(require("./builtin/slots/slots"));
    gameManager.registerGame(require("./builtin/heist/heist"));
};