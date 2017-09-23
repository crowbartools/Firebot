(function(){
  
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
       exemptList:{
         currentPage: 1,
         pageSize: 5
       },
       eventLog: {
         currentPage: 1,
         pageSize: 5
       }
     }
     
     // Banned Group Functions
     $scope.bannedGroup = groupsService.getBannedGroup();
     
     $scope.addUserToBannedGroup = function() {
       groupsService.addUserToBannedGroup($scope.newUser);        
       $scope.newUser = "";
     };
     
     $scope.removeUserFromBannedGroupAtIndex = function(index) {
       groupsService.removeUserFromBannedGroupAtIndex(index);
     };

     // Exempt Group Functions
     $scope.exemptGroup = groupsService.getExemptGroup();
     
     $scope.allViewerGroups = groupsService.getDefaultAndCustomViewerGroupNames();
     
     $scope.newExemptUser = "";
     $scope.addUserToExemptGroup = function() {
       groupsService.addUserToExemptGroup($scope.newExemptUser);        
       $scope.newExemptUser = "";
     };
     
     $scope.removeUserFromExemptGroupAtIndex = function(index) {
       groupsService.removeUserFromExemptGroupAtIndex(index);
     };     
     
     $scope.updateCheckedArrayWithElement = function(array, element) {
       // Update array
       $scope.exemptGroup.groups = utilityService.getNewArrayWithToggledElement(array, element);
       groupsService.updateExemptViewerGroups($scope.exemptGroup.groups);
     }
     
     $scope.arrayContainsElement = utilityService.arrayContainsElement; 
    
   });
 })();