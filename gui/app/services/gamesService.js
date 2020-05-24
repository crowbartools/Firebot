"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("gamesService", function($q, logger, backendCommunicator) {
            let service = {};

            service.games = [];

            service.loadGames = () => {
                $q.when(backendCommunicator.fireEventAsync("get-games"))
                    .then(games => {
                        if (games) {
                            service.games = games;
                        }
                    });
            };

            service.saveGame = (game) => {
                const index = service.games.findIndex(g => g.id === game.id);
                if (index < 0) return;
                service.games[index] = game;

                backendCommunicator.fireEvent("game-settings-update", {
                    gameId: game.id,
                    activeStatus: game.active,
                    settingCategories: game.settingCategories
                });
            };

            return service;
        });
}());
