"use strict";
(function() {
    angular
        .module("firebotApp")
        .controller("gamesController", function($scope, gamesService, utilityService) {
            $scope.gamesService = gamesService;

            $scope.openEditGameSettingsModal = function(game) {
                utilityService.showModal({
                    component: "editGameSettingsModal",
                    windowClass: "no-padding-modal",
                    resolveObj: {
                        game: () => game
                    },
                    closeCallback: updatedGame => {
                        if (updatedGame == null) return;
                        gamesService.saveGame(updatedGame);
                    }
                });
            };
        });
}());
