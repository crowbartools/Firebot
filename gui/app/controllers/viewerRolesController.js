"use strict";
(function() {
    // This handles the Groups tab

    angular
        .module("firebotApp")
        .controller("viewerRolesController", function($scope, utilityService, viewerRolesService) {

            $scope.viewerRolesService = viewerRolesService;

            $scope.showAddOrEditCustomRole = function() {

            };


        });
}());
