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


            /**
      * MODAL CONTROL
    */


            // This opens up a modal when adding a new command.
            $scope.showAddCommandModal = function(command) {
                let addCommandModalContext = {
                    templateUrl: "./templates/chat/command-modals/addCommandModal.html",
                    // This is the controller to be used for the modal.
                    controllerFunc: ($scope, $uibModalInstance, modalId) => {

                        // Set active viewer groups for command permissions.
                        $scope.viewerGroups = groupsService.getAllGroups();

                        $scope.isNewCommand = true;

                        // If we pass in a command, then we're editing. Otherwise this is a new command and we default to it being active.
                        if (command != null) {
                            $scope.command = command;
                            $scope.isNewCommand = false;
                        } else {
                            $scope.command = {active: true, permissions: [], effects: {}};
                        }

                        $scope.effects = $scope.command.effects;

                        $scope.effectListUpdated = function(effects) {
                            $scope.effects = effects;
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

                            if ($scope.commandID == null) {
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
                        $scope.deleteCommand = function (command) {
                            // Delete the command
                            commandsService.deleteCommand(command);

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
