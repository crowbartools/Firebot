"use strict";
(function() {
    // This handles the Groups tab

    angular
        .module("firebotApp")
        .controller("viewerRolesController", function($scope, utilityService, customRolesService) {
            $scope.getCustomViewerRoles = function() {
                return customRolesService.getCustomRoles();
            };

            $scope.showAddOrEditCustomRole = function() {

            };


        });
}());
