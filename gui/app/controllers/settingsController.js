(function(){
  
 //This handles the Settings tab
 
 angular
   .module('firebotApp')
   .controller('settingsController', function($scope, settingsService) {
        $scope.settings = settingsService;
   });
 })();