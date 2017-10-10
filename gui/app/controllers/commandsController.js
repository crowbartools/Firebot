(function(){
  
 //This handles the commands tab
 const _ = require('underscore')._;
 
 angular
   .module('firebotApp')
   .controller('commandsController', function($scope, commandsService, updatesService, utilityService, settingsService, groupsService, effectHelperService) {
    var EffectType = require('../../lib/common/EffectType.js').getAllEffectTypes('command');
    
    // Cache commands on app load.
     commandsService.refreshCommands();

     // Set button view to user setting value.
     $scope.buttonViewModeCommands = settingsService.getButtonViewMode('commands');

    // Set active viewer groups for command permissions.
    $scope.viewerGroups = groupsService.getAllGroups();

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


    /**
      * MODAL CONTROL
    */


    // This opens up a modal when adding a new command.
    $scope.showAddCommandModal = function(command){
      var addCommandModalContext = {
        templateUrl: "./templates/chat/command-modals/addCommandModal.html",
        // This is the controller to be used for the modal.
        controllerFunc: ($scope, $uibModalInstance) => {

          // Set active viewer groups for command permissions.
          $scope.viewerGroups = groupsService.getAllGroups();

          // If we pass in a command, then we're editing. Otherwise this is a new command and we default to it being active.
          if(command != null){
            $scope.command = command;
          } else {
            $scope.command = {active: true, permissions: []};
          }

          // Grab the EffectType 'enum' from effect.js
          $scope.effectTypes = EffectType;

          // This makes sure the last effect is open upon modal load.
          // We also call this when a new effect is added or an old effect is deleted
          // to open the last effect again.
          $scope.openEffectPanel = {}
          function updateOpenPanel() {
            // We get the index of the last effect and add true to a scope varible
            // that the accordian directive is looking at
            var lastEffectIndex = _.keys($scope.command.effects).length - 1;
            $scope.openEffectPanel[lastEffectIndex] = true;
          }

          $scope.getApprovedEffectTypes = function() {
            // Convert effecttypes to an array
            var approvedEffects =  Object.keys(EffectType).map(function(key) {
                  return EffectType[key];
                });
            if(!settingsService.getCustomScriptsEnabled()) {
              // If there are certain effect types that are available contionally,
              // we can filter them out here. Currently we only need this for the
              // Custom Script effect type.
              approvedEffects = approvedEffects.filter(type => {
                return type !== EffectType.CUSTOM_SCRIPT;
              });
            }
            return approvedEffects;
          }

          // When the user clicks "Save"
          $scope.saveChanges = function() {
            $uibModalInstance.close($scope.command);
            
            // Refresh Commands
            commandsService.refreshCommands();
          };

          $scope.changeEffectTypeForEffect = function(effectType, effect) {
            for (var property in effect){
              if (effect.hasOwnProperty(property)){
                  delete effect[property];
              }
            }
            effect.type = effectType;
          }

          // When they hit cancel or click outside the modal, we dont want to do anything
          $scope.dismiss = function() {
            $uibModalInstance.dismiss('cancel');
          };

          $scope.addEffect = function() {
            var newEffectIndex = 1;

            if($scope.command.effects != null) {
              newEffectIndex = _.keys($scope.command.effects).length + 1;
            } else {
              // Make sure effects object is initialized
              $scope.command.effects = {};
            }

            $scope.command.effects[newEffectIndex.toString()] = {
              type: "Nothing"
            };

            updateOpenPanel();
          }

          $scope.removeEffectAtIndex = function(index) {
            //set the previous open panel to false so whatever gets moved to the previous
            //slot doesnt auto-open
            $scope.openEffectPanel[index] = false;

            // remove effect
            delete $scope.command.effects[(index+1).toString()];

            //recalculate index numbers
            var newEffects = {};
            var count = 1;
            Object.keys($scope.command.effects).forEach(key => {
              var effect = $scope.command.effects[key];
              newEffects[count.toString()] = effect;
              count++;
            });

            $scope.command.effects = newEffects;
          }

          $scope.removeAllEffects = function() {
            $scope.command.effects = {};
          };

          $scope.copyEffects = function() {
              utilityService.copyButtonEffects($scope.command.effects);
          };

          $scope.pasteEffects = function() {
              if(utilityService.hasCopiedEffects()) {
                $scope.command.effects = utilityService.getCopiedButtonEffects();
              }
          };

          $scope.hasCopiedEffects = function() {
            return utilityService.hasCopiedEffects();
          };

          // This is run each time a group checkbox is clicked or unclicked.
          // This will build an array of currently selected groups to be saved to JSON.
          $scope.groupArray = function(list, item){
            $scope.command.permissions = effectHelperService.getCheckedBoxes(list, item);
          }

          // This checks if an item is in the command.permission array and returns true.
          // This allows us to check boxes when loading up this button effect.
          $scope.groupCheckboxer = function (list, item){
              return effectHelperService.checkSavedArray(list, item);         
          }

          // This deletes the current command.
          $scope.deleteCommand = function (command){
            // Delete the command
            commandsService.deleteCommand(command);

            // Close the modal
            $uibModalInstance.close();

            // Refresh Commands
            commandsService.refreshCommands();
          }

        },
        // The callback to run after the modal closed via "Save changes"
        closeCallback: (command) => {

          // Save to json
          commandsService.saveCommand(command);

          // Refresh cache
          commandsService.refreshCommands();
        }
      }
      utilityService.showModal(addCommandModalContext);
    } // End add command modal


    // This opens up the command settings modal.
    $scope.showCommandSettingsModal = function() {
      var showCommandSetingsModalContext = {
        templateUrl: "./templates/chat/command-modals/commandSettingsModal.html",
        size: "lg",
        controllerFunc: 'editCommandSettingsModalController'
      }
      utilityService.showModal(showCommandSetingsModalContext);
    }

   });
 })();