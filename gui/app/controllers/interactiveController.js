(function() {

  //This handles the Interactive tab

  const _ = require('underscore')._;
  const EffectType = require('../../lib/common/EffectType.js').InteractiveEffectType;

  angular
    .module('firebotApp')
    .controller('interactiveController', function($scope, $interval, $timeout, boardService,
      groupsService, settingsService, utilityService) {

      var settings = settingsService;

      $scope.groups = groupsService;

      $scope.buttonViewMode = settingsService.getButtonViewMode();

      $scope.activeSceneTab = 0;

      $scope.selectedBoard = function() {
        return boardService.getSelectedBoard();
      }

      $scope.getBoardNames = function() {
        return boardService.getBoardNames();
      }

      $scope.switchToBoard = function(boardName) {
        var board = boardService.getBoardByName(boardName);
        boardService.setSelectedBoard(board);
        resetSceneTab();
      }

      $scope.switchToBoardById = function(id) {
        var board = boardService.getBoardById(id);
        boardService.setSelectedBoard(board);
        resetSceneTab();
      }

      $scope.getScenesForSelectedBoard = function() {
        var board = $scope.selectedBoard();
        var scenes = [];
        if (board != null) {
          scenes = Object.keys(board.scenes);
        }
        return scenes;
      };

      $scope.getControlsForScene = function(scene) {
        var buttons = [];
        if ($scope.selectedBoard() != null) {
          buttons = $scope.selectedBoard().getControlsForScene(scene);
        }
        return buttons;
      }

      $scope.getJoysticksForScene = function(scene) {
        var joysticks = [];
        if ($scope.selectedBoard() != null) {
          joysticks = $scope.selectedBoard().getJoysticksForScene(scene);
        }
        return joysticks;
      }

      $scope.getAllControlsForScene = function(scene) {
        var buttons = $scope.getControlsForScene(scene);
        var joysticks = $scope.getJoysticksForScene(scene);
        var combined = buttons.concat(joysticks);
        return combined;
      }

      $scope.resyncCurrentBoard = function() {
        var board = boardService.getSelectedBoard();
        if(board != null) {
         boardService.loadBoardWithId(board.versionId);
       }
      }

      $scope.fireControlManually = function(controlId) {
        ipcRenderer.send('manualButton', controlId);
      }

      $scope.saveCurrentButtomViewMode = function(type) {
        settingsService.setButtonViewMode($scope.buttonViewMode, type);
      }

      function resetSceneTab() {
        $scope.activeSceneTab = 0;
      }

      // Tracks what button name the user is hovering over so we can show the ID instead of name
      var hoveringOverControlId = "";

      $scope.isHoverOverControlName = function(controlID) {
        return hoveringOverControlId === controlID;
      }

      $scope.setHoverOverControlId = function(controlID) {
        hoveringOverControlId = controlID;
      }

      $scope.getControlIdOrName = function(control) {
        if(control.text == null || control.text === "") {
          return `ID: ${control.controlId}`;
        }
        if($scope.isHoverOverControlName(control.controlId)) {
          return `ID: ${control.controlId}`;
        }
        return control.text;
      }

      /**
       * MODAL CONTROL
       */

       $scope.showBoardSettingsModal = function() {
         var showBoardSetingsModalContext = {
           templateUrl: "./templates/interactive/modals/boardSettingsModal.html",
           size: "lg",
           // This is the controller to be used for the modal.
           resolveObj: {
             board: () => {
               return $scope.selectedBoard();
             }
           },
           controllerFunc: 'editBoardSettingsModalController'
         }
         utilityService.showModal(showBoardSetingsModalContext);
       }

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
              boardService.loadBoardWithId(id).then(() => {
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
            }
          },
          size: "sm"
        }
        utilityService.showModal(deleteBoardModalContext);
      };

      /*
      * EDIT CONTROLL EFFECTS MODAL
      */
      $scope.showEditControlEffectsModal = function(controlButton) {
        var editControlEffectsModalContext = {
          templateUrl: "./templates/interactive/modals/editControlEffectsModal.html",
          // This is the controller to be used for the modal.
          controllerFunc: ($scope, $uibModalInstance, utilityService, control) => {
            // The model for the button we are editting
            $scope.control = control;

            // Default to active for controls unless told otherwise.
            if($scope.control.active != null){
              // Don't do anything because active has already been set to something.
            } else {
              $scope.control.active = true;
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
              var lastEffectIndex = _.keys($scope.control.effects).length - 1;
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

            // When the user clicks "Save", we want to pass the control back to interactiveController
            $scope.saveChanges = function() {
              $uibModalInstance.close($scope.control);

              // Send over control obj to backend to push to mixer if we're live.
              ipcRenderer.send('mixerButtonUpdate', $scope.control);

              // Refresh the interactive control cache.
              ipcRenderer.send('refreshInteractiveCache');
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
              //set the previous open panel to false so whatever gets moved to the previous
              //slot doesnt auto-open
              $scope.openEffectPanel[index] = false;

              // remove effect
              delete $scope.control.effects[(index+1).toString()];

              //recalculate index numbers
              var newEffects = {};
              var count = 1;
              Object.keys($scope.control.effects).forEach(key => {
                var effect = $scope.control.effects[key];
                newEffects[count.toString()] = effect;
                count++;
              });

              $scope.control.effects = newEffects;;
            }

            $scope.removeAllEffects = function() {
              $scope.control.effects = {};
            };

            $scope.copyEffects = function() {
                utilityService.copyButtonEffects($scope.control.effects);
            };

            $scope.pasteEffects = function() {
                if(utilityService.hasCopiedEffects()) {
                  $scope.control.effects = utilityService.getCopiedButtonEffects();
                }
            };

            $scope.hasCopiedEffects = function() {
              return utilityService.hasCopiedEffects();
            };
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

          boardService.setSelectedBoard(lastBoard);

          $scope.$applyAsync();

        });
      }
    });
})();
