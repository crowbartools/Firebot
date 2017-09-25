(function(){
  
 //This handles the commands tab
 const _ = require('underscore')._;
 const EffectType = require('../../lib/interactive/EffectType.js').EffectType;
 
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
    $scope.showAddCommandModal = function(command){
      var addCommandModalContext = {
        templateUrl: "./templates/chat/command-modals/addCommandModal.html",
        // This is the controller to be used for the modal.
        controllerFunc: ($scope, $uibModalInstance) => {

          // If we pass in a command, then we're editing. Otherwise this is a new command and we default to it being active.
          if(command != null){
            $scope.command = command;
          } else {
            $scope.command = {active: true};
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
    }

    // This opens a modal when editing a command.
    $scope.showEditCommandEffectsModal = function(){
      console.log('Success!');
    }

    ///////////
    // Effects (Can we put these somewhere they can be shared between interactive and commands?)
    ///////////


    
   });
 })();