(function() {

  //This handles the Interactive tab

  const _ = require('underscore')._;
  const EffectType = require('../../lib/interactive/EffectType.js').EffectType;

  angular
    .module('firebotApp')
    .controller('interactiveController', function($scope, $interval, boardService, groupsService, settingsService, utilityService) {

      var settings = settingsService;
      
      $scope.groups = groupsService;

      $scope.selectedBoard = boardService.getLastUsedBoard();

      $scope.getBoardNames = function() {      
        return boardService.getBoardNames();
      }

      $scope.switchToBoard = function(boardName) {
        var board = boardService.getBoardByName(boardName);
        setLastBoard(board);
      }
      
      $scope.switchToBoardById = function(id) {
        var board = boardService.getBoardById(id);
        setLastBoard(board);
      }

      $scope.getScenesForSelectedBoard = function() {
        var board = $scope.selectedBoard;
        var scenes = [];
        if (board != null) {
          scenes = _.keys(board.scenes);
        }
        return scenes;
      };

      $scope.getControlsForScene = function(scene) {
        var buttons = [];
        if ($scope.selectedBoard != null) {
          buttons = $scope.selectedBoard.getControlsForScene(scene);
        }
        return buttons;
      }

      $scope.getViewerGroupSettingsForScene = function(scene) {
        var board = $scope.selectedBoard;
        var settings = [];
        if (board != null) {
          settings = board.scenes[scene].default;
        }
        return settings;
      }

      $scope.getCooldownGroupSettings = function() {
        var board = $scope.selectedBoard;
        var settings = [];
        if (board != null) {
          settings = _.values(board.cooldownGroups);
        }
        return settings;
      }

      $scope.fireControlManually = function(controlId) {
        ipcRenderer.send('manualButton', controlId);
      }
      
      function setLastBoard(board) {
        if (board != null && ($scope.selectedBoard == null || board.name != $scope.selectedBoard.name)) {
          $scope.selectedBoard = board;
          settingsService.setLastBoardName(board.name);
        }
      }

      /**
       * MODAL CONTROL
       */
      
       /*
       * ADD BOARD MODAL
       */
      $scope.showAddBoardModal = function() {
        var addBoardModalContext = {
          templateUrl: "./templates/interactive/modals/addBoardModal.html",
          // This is the controller to be used for the modal. 
          controllerFunc: ($scope, $uibModalInstance) => {
            // The model for the board id text field
            $scope.newBoardId = "";
            
            // When the user clicks "Add board", we want to pass the id back to interactiveController
            $scope.addBoard = function() {
              $uibModalInstance.close($scope.newBoardId);
            };
            
            // When they hit cancel or click outside the modal, we dont want to do anything
            $scope.dismiss = function() {
              $uibModalInstance.dismiss('cancel');
            };
          },
          // The callback to run after the modal closed via "Add board"
          closeCallback: (id) => {
              boardService.addNewBoardWithId(id).then(() => {
                $scope.switchToBoardById(id);
              });
          }
        }      
        utilityService.showModal(addBoardModalContext);
      };
      
      /*
      * DELETE BOARD MODAL
      */
      $scope.showDeleteBoardModal = function() {
        var deleteBoardModalContext = {
          templateUrl: "./templates/interactive/modals/deleteBoardModal.html",
          // This is the controller to be used for the modal. 
          controllerFunc: ($scope, $uibModalInstance) => {
            
            // When the user clicks "delete", we want to pass true back to interactiveController
            $scope.confirmDelete = function() {
              $uibModalInstance.close(true);
            };
            
            // When they hit cancel or click outside the modal, we dont want to do anything
            $scope.dismiss = function() {
              $uibModalInstance.dismiss();
            };
          },
          // The callback to run after the modal closed via "Delete"
          closeCallback: (shouldDelete) => {
            if(shouldDelete === true) {
              boardService.deleteCurrentBoard();
              $scope.selectedBoard = null;
            }          
          }
        }      
        utilityService.showModal(deleteBoardModalContext);
      };
      
      /*
      * EDIT VIEWER GROUP MODAL
      */
      $scope.showEditViewerGroupDefaultsModal = function(sceneName) {
        var addBoardModalContext = {
          templateUrl: "./templates/interactive/modals/editViewerGroupModal.html",
          // This is the controller to be used for the modal. 
          controllerFunc: ($scope, $uibModalInstance, groupsService) => {
            // The model for the board id text field
            $scope.groups = groupsService;
            
            // When the user clicks "Save", we want to pass the id back to interactiveController
            $scope.saveChanges = function() {
              $uibModalInstance.close($scope.newBoardId);
            };
            
            // When they hit cancel or click outside the modal, we dont want to do anything
            $scope.dismiss = function() {
              $uibModalInstance.dismiss('cancel');
            };
          },
          // The callback to run after the modal closed via "Add board"
          closeCallback: (id) => {
              boardService.addNewBoardWithId(id);
          }
        }      
        utilityService.showModal(addBoardModalContext);
      };
      
      /*
      * EDIT CONTROLL EFFECTS MODAL
      */
      $scope.showEditControlEffectsModal = function(controlButton) {
        var editControlEffectsModalContext = {
          templateUrl: "./templates/interactive/modals/editControlEffectsModal.html",
          // This is the controller to be used for the modal. 
          controllerFunc: ($scope, $uibModalInstance, control) => {
            // The model for the button we are editting
            $scope.control = control;
            
            
            // Grab the EffectType 'enum' from effect.js        
            $scope.effectTypes = EffectType; 
                        
          
            // This makes sure the last effect is open upon modal load.
            // We also call this when a new effect is added or an old effect is deleted
            // to open the last effect again. 
            $scope.openEffectPanel = {}         
            function updateOpenPanel() {
              // We get the index of the last effect and add true to a scope varible
              // that the accordian directive is looking at
              var lastEffectIndex = _.keys($scope.control.effects).length - 1;
              $scope.openEffectPanel[lastEffectIndex] = true;
            }                  
            updateOpenPanel();
        
            $scope.getApprovedEffectTypes = function() {
              var approvedEffects = EffectType
              if(!settingsService.getCustomScriptsEnabled()) {
                // If there are certain effect types that are available contionally,
                // we can filter them out here. Currently we only need this for the
                // Custom Script effect type.
                approvedEffects = _.filter(approvedEffects, (type) => {
                  var includeType = true;
                  if(type == EffectType.CUSTOM_SCRIPT) {
                    includeType = false;
                  }
                  return includeType;
                });
              }
              return approvedEffects;
            }
            
            // When the user clicks "Save", we want to pass the control back to interactiveController
            $scope.saveChanges = function() {
              $uibModalInstance.close($scope.control);
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

              if($scope.control.effects != null) {
                newEffectIndex = _.keys($scope.control.effects).length + 1;
              } else {
                // Make sure effects object is initialized              
                $scope.control.effects = {};
              }
             
              $scope.control.effects[newEffectIndex.toString()] = {
                type: "Nothing"
              };
              
              updateOpenPanel();     
            }
            
            $scope.removeEffectAtIndex = function(index) {
              updateOpenPanel();
            }
          },
          resolveObj: {
            control: () => {
              // We want to copy the control button object so our changes don't 
              // apply to the our live cached version.
              return $.extend(true, {}, controlButton);
            }
          },
          // The callback to run after the modal closed via "Save changes"
          closeCallback: (edittedControl) => {

              // Save to json
              boardService.saveControlForCurrentBoard(edittedControl);
              
              // Copy editted button back to the original button object so we
              // keep our cache in sync. We do this instead of loading the entire board 
              // from the json file again.
              Object.assign(controlButton, edittedControl);
          }
        }      
        utilityService.showModal(editControlEffectsModalContext);
      };

      /**
       * Initial tab load
       */
      if (!boardService.hasBoardsLoaded() === true) {
        boardService.loadAllBoards().then(function() {

          var lastBoard = boardService.getLastUsedBoard();

          $scope.selectedBoard = lastBoard;
          $scope.$applyAsync();

        });
      }
    });
})();