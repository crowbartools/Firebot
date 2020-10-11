"use strict";

// Modal for adding or editting a command

(function() {
    angular.module("firebotApp").component("addOrEditCustomCommandModal", {
        templateUrl:
      "./directives/modals/commands/addOrEditCustomCommand/addOrEditCustomCommandModal.html",
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&",
            modalInstance: "<"
        },
        controller: function($scope, utilityService, commandsService, ngToast) {
            let $ctrl = this;

            $ctrl.allSortTags = commandsService.getSortTags();

            $ctrl.command = {
                active: true,
                sendCooldownMessage: true,
                cooldown: {},
                effects: {}
            };

            $ctrl.$onInit = function() {
                if ($ctrl.resolve.command == null) {
                    $ctrl.isNewCommand = true;
                } else {
                    $ctrl.command = JSON.parse(JSON.stringify($ctrl.resolve.command));
                }

                if ($ctrl.command.ignoreBot === undefined) {
                    $ctrl.command.ignoreBot = true;
                }

                if ($ctrl.command.sendCooldownMessage == null) {
                    $ctrl.command.sendCooldownMessage = true;
                }

                let modalId = $ctrl.resolve.modalId;
                utilityService.addSlidingModal(
                    $ctrl.modalInstance.rendered.then(() => {
                        let modalElement = $("." + modalId).children();
                        return {
                            element: modalElement,
                            name: "Edit Command",
                            id: modalId,
                            instance: $ctrl.modalInstance
                        };
                    })
                );

                $scope.$on("modal.closing", function() {
                    utilityService.removeSlidingModal();
                });
            };

            $ctrl.effectListUpdated = function(effects) {
                $ctrl.command.effects = effects;
            };

            $ctrl.deleteSubcommand = (id) => {
                if (id === "fallback-subcommand") {
                    $ctrl.command.fallbackSubcommand = null;
                } else if ($ctrl.command.subCommands) {
                    $ctrl.command.subCommands = $ctrl.command.subCommands.filter(sc => sc.id !== id);
                }
            };

            $ctrl.editSubcommand = (id) => {
                let subcommand;
                if (id === "fallback-subcommand") {
                    subcommand = $ctrl.command.fallbackSubcommand;
                } else if ($ctrl.command.subCommands) {
                    subcommand = $ctrl.command.subCommands.find(sc => sc.id === id);
                }
                if (subcommand) {
                    $ctrl.openAddSubcommandModal(subcommand);
                }
            };

            $ctrl.openAddSubcommandModal = (arg) => {
                utilityService.showModal({
                    component: "addOrEditSubcommandModal",
                    size: "sm",
                    resolveObj: {
                        arg: () => arg,
                        hasNumberArg: () => $ctrl.command.subCommands && $ctrl.command.subCommands.some(sc => sc.arg === "\\d+"),
                        hasUsernameArg: () => $ctrl.command.subCommands && $ctrl.command.subCommands.some(sc => sc.arg === "@\\w+"),
                        hasFallbackArg: () => $ctrl.command.fallbackSubcommand != null,
                        otherArgNames: () => $ctrl.command.subCommands && $ctrl.command.subCommands.filter(c => !c.regex && (arg ? c.arg !== arg.arg : true)).map(c => c.arg.toLowerCase()) || []
                    },
                    closeCallback: newArg => {
                        if (newArg.fallback) {
                            $ctrl.command.fallbackSubcommand = newArg;
                        } else {
                            if ($ctrl.command.subCommands == null) {
                                $ctrl.command.subCommands = [newArg];
                            } else {
                                $ctrl.command.subCommands = $ctrl.command.subCommands.filter(sc => sc.id !== newArg.id);
                                $ctrl.command.subCommands.push(newArg);
                            }
                        }
                    }
                });
            };

            $ctrl.delete = function() {
                if ($ctrl.isNewCommand) return;
                $ctrl.close({ $value: { command: $ctrl.command, action: "delete" } });
            };

            $ctrl.save = function() {
                if ($ctrl.command.trigger == null || $ctrl.command.trigger === "") {
                    ngToast.create("Please provide a trigger.");
                    return;
                }
                if (commandsService.triggerExists($ctrl.command.trigger, $ctrl.command.id)) {
                    ngToast.create("A custom command with this trigger already exists.");
                    return;
                }


                let action = $ctrl.isNewCommand ? "add" : "update";
                $ctrl.close({
                    $value: {
                        command: $ctrl.command,
                        action: action
                    }
                });
            };
        }
    });
}());
