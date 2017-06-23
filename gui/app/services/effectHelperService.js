(function(){
  
 // This provides helper methods for control effects
 
 const _ = require('underscore')._;
 
 const EffectType = require('../../lib/interactive/EffectType.js').EffectType;

 angular
  .module('firebotApp')
  .factory('effectHelperService', function () {
    var service = {};
      
    // Returns a controller to be used for the template of a given effectype
    service.getControllerForEffectTypeTemplate = function(effectType) {
      // Default empty controller. We can override it in the switch statement below.
      var controller = ($scope) => {};
      
      switch(effectType) {
        
        case EffectType.PLAY_SOUND:
          controller = ($scope, listenerService) => {
            
            var uuid = _.uniqueId();
            
            $scope.openFileExporer = function() {
              var registerRequest = {
                type: listenerService.ListenerType.SOUND_FILE,
                uuid: uuid,
                runOnce: true,
                publishEvent: true
              }
              listenerService.registerListener(registerRequest, (filepath) => {
                $scope.effect.file = filepath;
              });
            };    
          };
          break;
          
        case EffectType.SHOW_IMAGE:
          controller = ($scope, listenerService) => {
            
            $scope.imagePositions = [
              "Top Left",
              "Top Middle",
              "Top Right",
              "Middle Left",
              "Middle",
              "Middle Right",
              "Bottom Left",
              "Bottom Middle",
              "Bottom Right"
            ];
            
            var uuid = _.uniqueId(); 
            
            $scope.openFileExporer = function() {
              var registerRequest = {
                type: listenerService.ListenerType.IMAGE_FILE,
                uuid: uuid,
                runOnce: true,
                publishEvent: true
              }
              listenerService.registerListener(registerRequest, (filepath) => {
                $scope.effect.file = filepath;
              });
            };         
          };
          break;

        case EffectType.API_BUTTON:
          controller = ($scope) => {

            $scope.apiTypes = [
              "Advice",
              "Cat Picture",
              "Cat Fact",
              "Dog Picture",
              "Dog Fact",
              "Aww",
              "Pokemon",
              "Number Trivia"
            ]

          };
          break;

        case EffectType.CHANGE_GROUP:
          controller = ($scope, groupsService) => {

            // Load up viewer groups if they haven't been already.
            // Leaving this out causes no groups to load unless you first visit the groups panel.
            groupsService.loadViewerGroups();

            // Get viewer groups and push group name to scope.
            $scope.viewerGroups = [];
            var groups = groupsService.getViewerGroups();
            for (group of groups){
              $scope.viewerGroups.push(group.groupName);
            }

          };
          break;

        case EffectType.CHANGE_SCENE:
          controller = ($scope, groupsService, boardService) => {

            // Make the Change Scene option user friendly text.
            // EX: effect.reset = false should show as "Reset Scenes" in the ui.
            $scope.ufChangeSceneOption = function(){
              if($scope.effect.reset){
                return "Reset Scenes"
              } else if($scope.effect.reset === false){
                return "Change Scenes"
              } else {
                return "Pick One"
              }
            }

            // Load up viewer groups if they haven't been already.
            // Leaving this out causes no groups to load unless you first visit the groups panel.
            groupsService.loadViewerGroups();

            // Get viewer groups and push group name to scope.
            // This is for loading up all user group checkboxes.
            $scope.viewerGroups = [];
            var groups = groupsService.getViewerGroups();
            for (group of groups){
              $scope.viewerGroups.push(group.groupName);
            }

            // This is run each time a group checkbox is clicked or unclicked.
            // This will build an array of currently selected groups to be saved to JSON.
            $scope.groupArray = function(group){
              if($scope.effect.groups != null){
                var groupArray = $scope.effect.groups;
              } else {
                var groupArray = [];
              }              
              
              try{
                var itemIndex = groupArray.indexOf(group);
              } catch(err){
                var itemIndex = -1;
              }

              if(itemIndex != -1){
                // Item exists, so we're unchecking it.
                groupArray.splice(itemIndex, 1);
              } else {
                // Item doesn't exist! Add it in.
                groupArray.push(group);
              }

              // Set new scope var.
              $scope.effect.groups = groupArray;
            }

            // This uses the board service to get a list of scenes for the current board.
            $scope.getScenesForSelectedBoard = function(){
              return boardService.getScenesForSelectedBoard();
            }

            // This checks if an item is in the effect.group array and returns true.
            // This allows us to check boxes when loading up this button effect.
            $scope.groupCheckboxer = function (group){
              if($scope.effect.groups != null) {
                return $scope.effect.groups.indexOf(group) != -1;
              } else {
                return false;
              }              
            }

          };
          break;
      }
      
      return controller;
    }

    // This is an object that will get passed into the scope of every effect type template
    // containing common options that appear in more than one effect
    service.commonOptionsForEffectTypes = {
      chatters: ['Streamer', 'Bot']
    }
    
    // Generate the template file path based off of the effect type
    service.getTemplateFilePathForEffectType = function(effectType) {
      var normalizedEffectType = ""
      if(effectType != null) {
        normalizedEffectType = effectType.toLowerCase().replace(' ', '-');
      } else {
        normalizedEffectType = "no-effect-type-provided";
      }
      return './templates/interactive/effect-options/' + normalizedEffectType + '.html';
    }
    
    return service;
  });
})();