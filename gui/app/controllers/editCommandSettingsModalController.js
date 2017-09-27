(function(){
    
   // This handles the Groups tab
   
   const _ = require('underscore')._;
   
   angular
     .module('firebotApp')
     .controller('editCommandSettingsModalController', function($scope, $uibModalInstance, utilityService, commandsService) {

        // Gets timed group cache
        $scope.getTimedGroupSettings = function() {
            return commandsService.getTimedGroupSettings();
        }

        // Close modal when you click the x
        $scope.close = function() {
            $uibModalInstance.close();
        };
        
        // Close modal when you hit cancel
        $scope.dismiss = function() {
            $uibModalInstance.dismiss();
        };
  
     });
   })();