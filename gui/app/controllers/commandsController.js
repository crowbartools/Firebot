"use strict";
(function() {
  angular
    .module("firebotApp")
    .controller("commandsController", function(
      $scope,
      commandsService,
      updatesService,
      utilityService,
      settingsService,
      groupsService,
      effectHelperService
    ) {
      // Cache commands on app load.
      commandsService.refreshCommands();

      $scope.activeSceneTab = 0;

      $scope.commandsService = commandsService;

      $scope.getPermissionTooltip = command => {
        let type = command.permission.type;
        switch (type) {
          case "group":
            let groups = command.permission.groups;
            if (groups == null || groups.length < 1) {
              return "Command is set to Group permissions, but no groups are selected.";
            }
            return (
              "This command is restricted to the groups: " +
              command.permission.groups.join(", ")
            );
          case "individual":
            let username = command.permission.username;
            if (username == null || username === "") {
              return "Command is set to restrict to an individual but a name has not been provided.";
            }
            return "This command is restricted to the user: " + username;
          default:
            return "This command is available to everyone";
        }
      };

      $scope.toggleCustomCommandActiveState = command => {
        if (command == null) return;
        command.active = !command.active;
        commandsService.saveCustomCommand(command);
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
})();
