(function(){
  
 //This handles the commands tab
 
 angular
   .module('firebotApp')
   .controller('commandsController', function($scope, commandsService, updatesService, utilityService, settingsService) {
     // Refresh commands cache on load
     commandsService.refreshCommands();

     // TO DO: Commands needs it's own button view.
     $scope.buttonViewMode = settingsService.getButtonViewMode();

     $scope.getCommandTypes = function(){
         return commandsService.getCommandTypes();
     }

     $scope.getAllCommandsForType = function(commandType){
         return commandsService.getAllCommandsForType(commandType);
     }
    
   });
 })();