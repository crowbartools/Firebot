"use strict";
(function() {
    //This handles the Updates tab

    angular
        .module("firebotApp")
        .controller("updatesController", function($scope, $rootScope, updatesService) {

            $scope.getUpdateData = function() {
                return updatesService.updateData;
            };

            $scope.us = updatesService;

            // Get update information if we havent already
            if (!updatesService.hasCheckedForUpdates) {
                updatesService.checkForUpdate();
            }

            $scope.downloadAndInstallUpdate = function() {
                if (process.platform === 'win32') {
                    updatesService.downloadAndInstallUpdate();
                } else {
                    $rootScope.openLinkExternally(updatesService.updateData.gitLink);
                }
            };

            $scope.canUpdateAutomatically = function() {
                return process.platform === 'win32';
            };
        });
}());
