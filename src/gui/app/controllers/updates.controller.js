"use strict";
(function() {
    //This handles the Updates tab

    angular
        .module("firebotApp")
        .controller("updatesController", function($scope, updatesService) {

            $scope.getUpdateData = function() {
                return updatesService.updateData;
            };

            $scope.us = updatesService;

            // Get update information if we havent already
            if (!updatesService.hasCheckedForUpdates) {
                updatesService.checkForUpdate();
            }

            $scope.downloadAndInstallUpdate = function() {
                updatesService.downloadAndInstallUpdate();
            };
        });
}());
