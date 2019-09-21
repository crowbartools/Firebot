"use strict";
(function() {
    angular
        .module("firebotApp")
        .controller("commandsController", function(
            $scope,
            commandsService,
            utilityService,
            listenerService
        ) {
            // Cache commands on app load.
            commandsService.refreshCommands();

            $scope.activeCmdTab = 0;

            $scope.commandsService = commandsService;

            $scope.getPermisisonType = command => {

                if (!command.restrictions ||
                    command.restrictions.length < 1 ||
                    !command.restrictions.some(r => r.type === "firebot:permissions")) {
                    return "None";
                }

                let permissions = command.restrictions.find(r => r.type === "firebot:permissions");

                if(permissions.mode === "roles") {
                    return "Roles"
                }
                else if (permissions.mode === "s")

            };

            $scope.getPermissionTooltip = command => {
                let type = command.permission ? command.permission.type : "",
                    groups,
                    username;

                switch (type) {
                case "group":
                    groups = command.permission.groups;
                    if (groups == null || groups.length < 1) {
                        return "Command is set to Group permissions, but no groups are selected.";
                    }
                    return (
                        "This command is restricted to the groups: " + command.permission.groups.join(", ")
                    );
                case "individual":
                    username = command.permission.username;
                    if (username == null || username === "") {
                        return "Command is set to restrict to an individual but a name has not been provided.";
                    }
                    return "This command is restricted to the user: " + username;
                default:
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

            $scope.deleteCustomCommand = command => {
                commandsService.deleteCustomCommand(command);
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
        });
}());
