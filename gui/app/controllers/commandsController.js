"use strict";
(function() {
    angular
        .module("firebotApp")
        .controller("commandsController", function(
            $scope,
            triggerSearchFilter,
            sortTagSearchFilter,
            commandsService,
            utilityService,
            listenerService,
            viewerRolesService,
            objectCopyHelper
        ) {
            // Cache commands on app load.
            commandsService.refreshCommands();

            $scope.activeCmdTab = 0;

            $scope.commandsService = commandsService;

            function filterCommands() {
                return triggerSearchFilter(sortTagSearchFilter(commandsService.getCustomCommands(), commandsService.selectedSortTag), commandsService.customCommandSearch);
            }

            $scope.filteredCommands = filterCommands();

            $scope.$watchGroup(
                [
                    'commandsService.selectedSortTag',
                    'commandsService.customCommandSearch',
                    'commandsService.commandsCache.customCommands'
                ],
                function (_newVal, _oldVal, scope) {
                    scope.filteredCommands = filterCommands();
                },
                true);

            $scope.getPermisisonType = command => {

                let permissions = command.restrictionData && command.restrictionData.restrictions &&
                    command.restrictionData.restrictions.find(r => r.type === "firebot:permissions");

                if (permissions) {
                    if (permissions.mode === "roles") {
                        return "Roles";
                    } else if (permissions.mode === "viewer") {
                        return "Viewer";
                    }
                } else {
                    return "None";
                }
            };

            $scope.getPermissionTooltip = command => {

                let permissions = command.restrictionData && command.restrictionData.restrictions &&
                    command.restrictionData.restrictions.find(r => r.type === "firebot:permissions");

                if (permissions) {
                    if (permissions.mode === "roles") {
                        let roleIds = permissions.roleIds;
                        let output = "None selected";
                        if (roleIds.length > 0) {
                            output = roleIds
                                .filter(id => viewerRolesService.getRoleById(id) != null)
                                .map(id => viewerRolesService.getRoleById(id).name)
                                .join(", ");
                        }
                        return `Roles (${output})`;
                    } else if (permissions.mode === "viewer") {
                        return `Viewer (${permissions.username ? permissions.username : 'No name'})`;
                    }
                } else {
                    return "This command is available to everyone";
                }
            };

            $scope.manuallyTriggerCommand = id => {
                listenerService.fireEvent(
                    listenerService.EventType.COMMAND_MANUAL_TRIGGER,
                    id
                );
            };

            $scope.toggleCustomCommandActiveState = command => {
                if (command == null) return;
                command.active = !command.active;
                commandsService.saveCustomCommand(command);
                commandsService.refreshCommands();
            };

            $scope.toggleSortTag = (command, tagId) => {
                if (command == null) return;
                if (command.sortTags == null) {
                    command.sortTags = [];
                }
                if (command.sortTags.includes(tagId)) {
                    command.sortTags = command.sortTags.filter(id => id !== tagId);
                } else {
                    command.sortTags.push(tagId);
                }
                commandsService.saveCustomCommand(command);
                commandsService.refreshCommands();
            };

            $scope.deleteCustomCommand = command => {
                utilityService.showConfirmationModal({
                    title: "Delete Command",
                    question: `Are you sure you want to delete the command '${command.trigger}'?`,
                    confirmLabel: "Delete",
                    confirmBtnType: "btn-danger"
                }).then(confirmed => {
                    if (confirmed) {
                        commandsService.deleteCustomCommand(command);
                        commandsService.refreshCommands();
                    }
                });
            };

            $scope.duplicateCustomCommand = command => {
                let copiedCommand = objectCopyHelper.copyObject("command", command);

                while (commandsService.triggerExists(copiedCommand.trigger)) {
                    copiedCommand.trigger += "copy";
                }

                commandsService.saveCustomCommand(copiedCommand);
                commandsService.refreshCommands();
            };

            $scope.openAddOrEditCustomCommandModal = function(command) {
                utilityService.showModal({
                    component: "addOrEditCustomCommandModal",
                    resolveObj: {
                        command: () => command
                    },
                    closeCallback: resp => {
                        let action = resp.action,
                            command = resp.command;

                        switch (action) {
                        case "add":
                        case "update":
                            commandsService.saveCustomCommand(command);
                            break;
                        case "delete":
                            commandsService.deleteCustomCommand(command);
                            break;
                        }

                        // Refresh Commands
                        commandsService.refreshCommands();
                    }
                });
            };

            $scope.sortableOptions = {
                handle: ".dragHandle",
                'ui-preserve-size': true,
                stop: () => {
                    if (commandsService.selectedSortTag != null &&
                        (commandsService.customCommandSearch == null ||
                            commandsService.customCommandSearch.length < 1)) return;
                    commandsService.saveAllCustomCommands($scope.filteredCommands);
                }
            };

            $scope.commandMenuOptions = (command) => {
                const options = [
                    {
                        html: `<a href ><i class="far fa-pen" style="margin-right: 10px;"></i> Edit</a>`,
                        click: function ($itemScope) {
                            let command = $itemScope.command;
                            $scope.openAddOrEditCustomCommandModal(command);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-toggle-off" style="margin-right: 10px;"></i> Toggle Enabled</a>`,
                        click: function ($itemScope) {
                            let command = $itemScope.command;
                            $scope.toggleCustomCommandActiveState(command);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-clone" style="margin-right: 10px;"></i> Duplicate</a>`,
                        click: function ($itemScope) {
                            let command = $itemScope.command;
                            $scope.duplicateCustomCommand(command);
                        }
                    },
                    {
                        html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete</a>`,
                        click: function ($itemScope) {
                            let command = $itemScope.command;
                            $scope.deleteCustomCommand(command);
                        }
                    }
                ];

                const sortTags = commandsService.getSortTags();

                if (sortTags.length > 0) {
                    options.push({
                        text: "Sort tags...",
                        children: sortTags.map(st => {
                            const isSelected = command.sortTags && command.sortTags.includes(st.id);
                            return {
                                html: `<a href><i class="${isSelected ? 'fas fa-check' : ''}" style="margin-right: ${isSelected ? '10' : '27'}px;"></i> ${st.name}</a>`,
                                click: () => {
                                    $scope.toggleSortTag(command, st.id);
                                }
                            };
                        }),
                        hasTopDivider: true
                    });
                }

                return options;
            };
        });
}());
