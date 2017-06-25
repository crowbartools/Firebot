(function(){
  
 //This handles the Settings tab
 
 angular
   .module('firebotApp')
   .controller('settingsController', function($scope, settingsService, utilityService) {
        $scope.settings = settingsService;
        $scope.showSetupWizard = utilityService.showSetupWizard;
   });
 })();