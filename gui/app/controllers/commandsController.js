(function(){
  
 //This handles the commands tab
 
 angular
   .module('firebotApp')
   .controller('commandsController', function($scope, commandsService, updatesService, utilityService, settingsService) {
     // Cache commands on app load.
     commandsService.refreshCommands();

     // Set button view to user setting value.
     $scope.buttonViewModeCommands = settingsService.getButtonViewMode('commands');

    //Save button view.
    $scope.saveCurrentButtonViewMode = function(type) {
      settingsService.setButtonViewMode($scope.buttonViewModeCommands, type);
    }

    // Gets an array of command types.
    $scope.getCommandTypes = function(){
        return commandsService.getCommandTypes();
    }

    // Gets all commands within a certain command type.
    $scope.getAllCommandsForType = function(commandType){
        return commandsService.getAllCommandsForType(commandType);
    }

    // This opens up a modal when adding a new command.
    $scope.showAddCommandModal = function(){
      console.log('Success!');
    }

    // This opens a modal when editing a command.
    $scope.showEditCommandEffectsModal = function(){
      console.log('Success!');
    }
    
   });
 })();