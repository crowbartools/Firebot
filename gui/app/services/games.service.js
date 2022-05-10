"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("gamesService", function($q, backendCommunicator) {
            const service = {};

            service.games = [];

            service.loadGames = () => {
                $q.when(backendCommunicator.fireEventAsync("get-games"))
                    .then(games => {
                        if (games) {
                            service.games = games;
                        }
                    });
            };

            backendCommunicator.on("game-settings-updated", (games) => {
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

                backendCommunicator.fireEvent("game-settings-update", {
                    gameId: game.id,
                    activeStatus: game.active,
                    settingCategories: game.settingCategories
                });
            };

            service.resetGameToDefault = gameId => {
                backendCommunicator.fireEvent("reset-game-to-defaults", gameId);
            };

            return service;
        });
}());
