"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("gamesService", function(backendCommunicator) {
            const service = {};

            service.games = [];

            backendCommunicator.on("games:game-settings-updated", (games) => {
                if (games) {
                    service.games = games;
                }
            });

            service.saveGame = (game) => {
                const index = service.games.findIndex(g => g.id === game.id);
                if (index < 0) {
                    return;
                }

                service.games[index] = game;

                backendCommunicator.send("games:update-game-settings", {
                    gameId: game.id,
                    activeStatus: game.active,
                    settingCategories: game.settingCategories
                });
            };

            service.resetGameToDefault = (gameId) => {
                backendCommunicator.send("games:reset-game-to-defaults", gameId);
            };

            backendCommunicator.send("games:ui-service-ready");

            return service;
        });
}());