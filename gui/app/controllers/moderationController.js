"use strict";
(function() {
    //This handles the Moderation tab

    angular
        .module("firebotApp")
        .controller("moderationController", function($scope, eventLogService) {

            $scope.activeTab = 0;

            $scope.eventLogService = eventLogService;

            $scope.pagination = {
                generalLog: {
                    currentPage: 1,
                    pageSize: 5
                },
                alertLog: {
                    currentPage: 1,
                    pageSize: 5
                }
            };
        });
}());
