"use strict";

const gameManager = require("./game-manager");

const slots = require("./builtin/slots/slots");

exports.loadGames = () => {
    gameManager.registerGame(slots);
};