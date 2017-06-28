(function(){
  
 //This handles the Moderation tab
 
 angular
   .module('firebotApp')
   .controller('moderationController', function($scope, eventLogService, groupsService) {
     
     groupsService.loadViewerGroups();
     
     $scope.eventLogService = eventLogService;
     
     $scope.pagination = {
       bannedList: {
         currentPage: 1,
         pageSize: 5
       },
       eventLog: {
         currentPage: 1,
         pageSize: 5
       }
     }
     
     $scope.bannedGroup = groupsService.getBannedGroup();
     
     $scope.addUserToBannedGroup = function() {
       groupsService.addUserToBannedGroup($scope.newUser);        
       $scope.newUser = "";
     };
     
     $scope.removeUserFromBannedGroupAtIndex = function(index) {
       groupsService.removeUserFromBannedGroupAtIndex(index);
     };
   });
 })();