(function(){
  
 //This handles the commands tab
 
 angular
   .module('firebotApp')
   .controller('commandsController', function($scope, commandsService, updatesService, utilityService, settingsService) {
     // Cache commands on app load.
     commandsService.refreshCommands();

     // TO DO: Commands needs it's own button view.
     $scope.buttonViewMode = settingsService.getButtonViewMode();

     // Gets an array of command types.
     $scope.getCommandTypes = function(){
         return commandsService.getCommandTypes();
     }

     // Gets all commands within a certain command type.
     $scope.getAllCommandsForType = function(commandType){
         return commandsService.getAllCommandsForType(commandType);
     }
    
   });
 })();