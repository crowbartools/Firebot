'use strict';
(function($) {

    //This handles the Interactive tab
    const EffectType = require('../../lib/common/EffectType.js').InteractiveEffectType;

    angular
        .module('firebotApp')
        .controller('interactiveController', function($scope, $rootScope, $interval, $timeout, boardService,
            groupsService, settingsService, utilityService) {

            function resetSceneTab() {
                $scope.activeSceneTab = 0;
            }

            // Tracks what button name the user is hovering over so we can show the ID instead of name
            let hoveringOverControlId = "";

            $scope.groups = groupsService;

            $scope.buttonViewMode = settingsService.getButtonViewMode();

            $scope.activeSceneTab = 0;

            $scope.selectedBoard = function() {
                return boardService.getSelectedBoard();
            };

            $scope.getBoardNames = function() {
                return boardService.getBoardNames();
            };

            $scope.isLoadingBoards = function() {
                return boardService.isloadingBoards();
            };

            $scope.switchToBoard = function(boardName) {
                let board = boardService.getBoardByName(boardName);
                boardService.setSelectedBoard(board);
                resetSceneTab();
            };

            $scope.switchToBoardById = function(id) {
                let board = boardService.getBoardById(id);
                boardService.setSelectedBoard(board);
                resetSceneTab();
            };

            $scope.getScenesForSelectedBoard = function() {
                let board = $scope.selectedBoard();
                let scenes = [];
                if (board != null && board.scenes != null) {
                    scenes = Object.keys(board.scenes);
                }
                return scenes;
            };

            $scope.getControlsForScene = function(scene) {
                let buttons = [];
                if ($scope.selectedBoard() != null) {
                    buttons = $scope.selectedBoard().getControlsForScene(scene);
                }
                return buttons;
            };

            $scope.getJoysticksForScene = function(scene) {
                let joysticks = [];
                if ($scope.selectedBoard() != null) {
                    joysticks = $scope.selectedBoard().getJoysticksForScene(scene);
                }
                return joysticks;
            };

            $scope.getAllControlsForScene = function(scene) {
                let buttons = $scope.getControlsForScene(scene);
                let joysticks = $scope.getJoysticksForScene(scene);
                let combined = buttons.concat(joysticks);
                return combined;
            };

            $scope.resyncCurrentBoard = function() {
                let board = boardService.getSelectedBoard();
                if (board != null) {
                    boardService.loadBoardWithId(board.versionId, true);
                }

                // Refresh the interactive control cache.
                ipcRenderer.send('refreshInteractiveCache');
            };

            $scope.fireControlManually = function(controlId) {
                ipcRenderer.send('manualButton', controlId);
            };

            $scope.saveCurrentButtomViewMode = function(type) {
                settingsService.setButtonViewMode($scope.buttonViewMode, type);
            };

            $scope.isHoverOverControlName = function(controlID) {
                return hoveringOverControlId === controlID;
            };

            $scope.setHoverOverControlId = function(controlID) {
                hoveringOverControlId = controlID;
            };

            $scope.getControlIdOrName = function(control) {
                if (control.text == null || control.text.trim() === "") {
                    return `ID: ${control.controlId}`;
                }
                if ($scope.isHoverOverControlName(control.controlId)) {
                    return `ID: ${control.controlId}`;
                }
                return control.text;
            };

            /**
           * MODAL CONTROL
           */

            $scope.showBoardSettingsModal = function() {
                let showBoardSetingsModalContext = {
                    templateUrl: "./templates/interactive/modals/boardSettingsModal.html",
                    size: "lg",
                    // This is the controller to be used for the modal.
                    resolveObj: {
                        board: () => {
                            return $scope.selectedBoard();
                        }
                    },
                    controllerFunc: 'editBoardSettingsModalController'
                };
                utilityService.showModal(showBoardSetingsModalContext);
            };

            /*
           * ADD BOARD MODAL
           */
            $scope.showAddBoardModal = function() {
                let addBoardModalContext = {
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
                };
                utilityService.showModal(addBoardModalContext);
            };

            /*
          * DELETE BOARD MODAL
          */
            $scope.showDeleteBoardModal = function() {
                let deleteBoardModalContext = {
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
                        if (shouldDelete === true) {
                            boardService.deleteCurrentBoard();
                        }
                    },
                    size: "sm"
                };
                utilityService.showModal(deleteBoardModalContext);
            };

            /*
          * EDIT CONTROLL EFFECTS MODAL
          */
            $scope.showEditControlEffectsModal = function(controlButton) {
                let editControlEffectsModalContext = {
                    templateUrl: "./templates/interactive/modals/editControlEffectsModal.html",
                    keyboard: false,
                    backdrop: 'static',
                    // This is the controller to be used for the modal.
                    controllerFunc: ($scope, $uibModal, $uibModalInstance, groupsService, effectHelperService, utilityService, control, modalId) => {
                        // The model for the button we are editting
                        $scope.control = control;

                        // Default to active for controls unless told otherwise.
                        if ($scope.control.active != null) {
                            // Don't do anything because active has already been set to something.
                        } else {
                            $scope.control.active = true;
                        }

                        // Temporary: Check group permissions radio button if control permissions are an array.
                        // This can be removed after a few releases.
                        if ($scope.control.permissions instanceof Array) {
                            $scope.control.permissionType = "Group";
                        }

                        // Clear permissions array.
                        // When a person clicks "individual" for permissions we want to clear out the array.
                        $scope.clearPermissions = function() {
                            if ($scope.control.permissions instanceof Array) {
                                $scope.control.permissions = "";
                            }
                        };

                        $scope.modalId = modalId;
                        utilityService.addSlidingModal($uibModalInstance.rendered.then(() => {
                            let modalElement = $("." + modalId).children();
                            return {
                                element: modalElement,
                                name: "Edit Button",
                                id: modalId,
                                instance: $uibModalInstance
                            };
                        }));

                        $scope.$on('modal.closing', function() {
                            utilityService.removeSlidingModal();
                        });


                        // Grab the EffectType 'enum' from effect.js
                        $scope.effectTypes = EffectType;

                        $scope.effects = control.effects;

                        $scope.effectListUpdated = function(effects) {
                            $scope.effects = effects;
                        };

                        // Get all viewer groups for permissions settings.
                        $scope.viewerGroups = groupsService.getAllGroups();

                        // This is run each time a group checkbox is clicked or unclicked.
                        // This will build an array of currently selected groups to be saved to JSON.
                        $scope.groupArray = function(list, item) {
                            $scope.control.permissions = effectHelperService.getCheckedBoxes(list, item);
                        };

                        // This checks if an item is in the command.permission array and returns true.
                        // This allows us to check boxes when loading up this button effect.
                        $scope.groupCheckboxer = function (list, item) {
                            return effectHelperService.checkSavedArray(list, item);
                        };

                        // When the user clicks "Save", we want to pass the control back to interactiveController
                        $scope.saveChanges = function() {

                            $scope.control.effects = $scope.effects;

                            $uibModalInstance.close($scope.control);

                            // Send over control obj to backend to push to mixer if we're live.
                            ipcRenderer.send('mixerButtonUpdate', $scope.control);

                            // Refresh the interactive control cache.
                            ipcRenderer.send('refreshInteractiveCache');
                        };

                        // When they hit cancel or click outside the modal, we dont want to do anything
                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss('cancel');
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
                };
                utilityService.showModal(editControlEffectsModalContext);
            };

            /**
             * Initial tab load
             */
            if (!boardService.hasBoardsLoaded() === true) {
                $rootScope.showSpinner = true;
                boardService.loadAllBoards().then(function() {

                    let lastBoard = boardService.getLastUsedBoard();

                    boardService.setSelectedBoard(lastBoard);

                    $scope.$applyAsync();

                    $rootScope.showSpinner = false;
                });
            }
        });
}(window.jQuery));
