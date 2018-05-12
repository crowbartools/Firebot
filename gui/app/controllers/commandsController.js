'use strict';
(function() {

    angular
        .module('firebotApp')
        .controller('commandsController', function($scope, commandsService, updatesService, utilityService, settingsService, groupsService, effectHelperService) {

            // Cache commands on app load.
            commandsService.refreshCommands();

            // Set button view to user setting value.
            $scope.buttonViewModeCommands = settingsService.getButtonViewMode('commands');

            // Set active viewer groups for command permissions.
            $scope.viewerGroups = groupsService.getAllGroups();

            $scope.activeSceneTab = 0;

            //Save button view.
            $scope.saveCurrentButtonViewMode = function(type) {
                settingsService.setButtonViewMode($scope.buttonViewModeCommands, type);
            };

            // Gets an array of command types.
            $scope.getCommandTypes = function() {
                return commandsService.getCommandTypes();
            };

            // Gets all commands within a certain command type.
            $scope.getAllCommandsForType = function(commandType) {
                return commandsService.getAllCommandsForType(commandType);
            };

            // Return command roles array.
            $scope.getCommandRoles = function (command) {
                return commandsService.getCommandRoles(command);
            };


            /**
      * MODAL CONTROL
    */


            // This opens up a modal when adding a new command.
            $scope.showAddCommandModal = function(command) {
                let addCommandModalContext = {
                    templateUrl: "./templates/chat/command-modals/addCommandModal.html",
                    // This is the controller to be used for the modal.
                    controllerFunc: ($scope, $uibModalInstance, command, modalId) => {

                        // Set active viewer groups for command permissions.
                        $scope.viewerGroups = groupsService.getAllGroups();

                        $scope.isNewCommand = true;
                        let previousCmdId = "";

                        // If we pass in a command, then we're editing. Otherwise this is a new command and we default to it being active.
                        if (command != null) {
                            $scope.command = command;
                            $scope.isNewCommand = false;
                            previousCmdId = command.commandID;
                        } else {
                            $scope.command = {active: true, permissions: [], effects: {}};
                        }

                        $scope.effects = $scope.command.effects;

                        $scope.effectListUpdated = function(effects) {
                            $scope.effects = effects;
                        };

                        // Temporary: Check group permissions radio button if control permissions are an array.
                        // This can be removed after a few releases.
                        if ($scope.command.permissions instanceof Array) {
                            $scope.command.permissionType = "Group";
                        }

                        // Clear permissions array.
                        // When a person clicks "individual" for permissions we want to clear out the array.
                        $scope.clearPermissions = function() {
                            if ($scope.command.permissions instanceof Array) {
                                $scope.command.permissions = "";
                            }
                        };

                        utilityService.addSlidingModal($uibModalInstance.rendered.then(() => {
                            let modalElement = $("." + modalId).children();
                            return {
                                element: modalElement,
                                name: "Edit Command",
                                id: modalId,
                                instance: $uibModalInstance
                            };
                        }));

                        $scope.$on('modal.closing', function() {
                            utilityService.removeSlidingModal();
                        });

                        // When the user clicks "Save"
                        $scope.saveChanges = function() {

                            if ($scope.command.commandID == null) {
                                return;
                            }

                            $scope.command.effects = $scope.effects;

                            $uibModalInstance.close($scope.command);

                            // Refresh Commands
                            commandsService.refreshCommands();
                        };

                        // When they hit cancel or click outside the modal, we dont want to do anything
                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss('cancel');
                        };

                        // This is run each time a group checkbox is clicked or unclicked.
                        // This will build an array of currently selected groups to be saved to JSON.
                        $scope.groupArray = function(list, item) {
                            $scope.command.permissions = effectHelperService.getCheckedBoxes(list, item);
                        };

                        // This checks if an item is in the command.permission array and returns true.
                        // This allows us to check boxes when loading up this button effect.
                        $scope.groupCheckboxer = function (list, item) {
                            return effectHelperService.checkSavedArray(list, item);
                        };

                        // This deletes the current command.
                        $scope.deleteCommand = function () {

                            //reset to original cmdId in case they altered it before clicking delete.
                            $scope.command.commandID = previousCmdId;

                            // Delete the command
                            commandsService.deleteCommand($scope.command);

                            // Close the modal
                            $uibModalInstance.close();

                            // Refresh Commands
                            commandsService.refreshCommands();
                        };

                    },
                    // The callback to run after the modal closed via "Save changes"
                    closeCallback: (command) => {

                        // Save to json
                        commandsService.saveCommand(command);

                        // Refresh cache
                        commandsService.refreshCommands();
                    },
                    resolveObj: {
                        command: () => {
                            if (command == null) return null;
                            return JSON.parse(angular.toJson(command));
                        }
                    }
                };
                utilityService.showModal(addCommandModalContext);
            }; // End add command modal


            // This opens up the command settings modal.
            $scope.showCommandSettingsModal = function() {
                let showCommandSetingsModalContext = {
                    templateUrl: "./templates/chat/command-modals/commandSettingsModal.html",
                    size: "lg",
                    controllerFunc: 'editCommandSettingsModalController'
                };
                utilityService.showModal(showCommandSetingsModalContext);
            };

        });
}());
