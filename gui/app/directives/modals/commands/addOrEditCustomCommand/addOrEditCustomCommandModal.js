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
