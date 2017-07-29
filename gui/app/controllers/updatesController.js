(function(){
  
 //This handles the Updates tab
 
 angular
   .module('firebotApp')
   .controller('updatesController', function($scope, updatesService, utilityService) {
     
      $scope.getUpdateData = function() {
        return updatesService.updateData;
      }

      // Get update information if we havent alreday
      if(!updatesService.hasCheckedForUpdates) {
        updatesService.checkForUpdate();
      }
      
      $scope.downloadAndInstallUpdate = function() {
        updatesService.downloadAndInstallUpdate();
      }
    
   });
 })();