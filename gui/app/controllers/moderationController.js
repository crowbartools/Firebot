'use strict';
(function() {

    //This handles the Moderation tab

    angular
        .module('firebotApp')
        .controller('moderationController', function($scope, eventLogService, groupsService, utilityService) {

            groupsService.loadViewerGroups();

            $scope.eventLogService = eventLogService;

            $scope.pagination = {
                bannedList: {
                    currentPage: 1,
                    pageSize: 5
                },
                exemptList: {
                    currentPage: 1,
                    pageSize: 5
                },
                generalLog: {
                    currentPage: 1,
                    pageSize: 5
                },
                alertLog: {
                    currentPage: 1,
                    pageSize: 5
                }
            };

            // Banned Group Functions
            $scope.bannedGroup = groupsService.getBannedGroup();

            $scope.addUserToBannedGroup = function() {
                groupsService.addUserToBannedGroup($scope.newUser);
                $scope.newUser = "";
            };

            $scope.removeUserFromBannedGroupAtIndex = function(index) {
                let mappedIndex = index + (($scope.pagination.bannedList.currentPage - 1) * $scope.pagination.bannedList.pageSize);
                groupsService.removeUserFromBannedGroupAtIndex(mappedIndex);
            };

            // Exempt Group Functions
            $scope.exemptGroup = groupsService.getExemptGroup();

            $scope.allViewerGroups = groupsService.getDefaultAndCustomViewerGroupsForSparkExempt();

            $scope.newExemptUser = "";
            $scope.addUserToExemptGroup = function() {
                groupsService.addUserToExemptGroup($scope.newExemptUser);
                $scope.newExemptUser = "";
            };

            $scope.removeUserFromExemptGroupAtIndex = function(index) {
                let mappedIndex = index + (($scope.pagination.exemptList.currentPage - 1) * $scope.pagination.exemptList.pageSize);
                groupsService.removeUserFromExemptGroupAtIndex(mappedIndex);
            };

            $scope.updateCheckedArrayWithElement = function(array, element) {
                // Update array
                $scope.exemptGroup.groups = utilityService.getNewArrayWithToggledElement(array, element);
                groupsService.updateExemptViewerGroups($scope.exemptGroup.groups);
            };

            $scope.arrayContainsElement = utilityService.arrayContainsElement;

        });
}());
