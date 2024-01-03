"use strict";

(function() {
    angular.module("firebotApp").component("editSystemCommandModal", {
        templateUrl: "./directives/modals/commands/editSystemCommand/editSystemCommandModal.html",
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&",
            modalInstance: "<"
        },
        controller: function() {
            const $ctrl = this;

            $ctrl.command = {};

            $ctrl.$onInit = function() {
                if ($ctrl.resolve.command != null) {
                    // doing the json stuff is a relatively simple way to deep copy a command object.
                    $ctrl.command = JSON.parse(JSON.stringify($ctrl.resolve.command));
                }
            };

            $ctrl.effectListUpdated = function(effects) {
                $ctrl.command.effects = effects;
            };

            $ctrl.reset = function() {
                $ctrl.close({
                    $value: {
                        action: "reset",
                        command: $ctrl.command
                    }
                });
            };
            $ctrl.save = function() {
                if ($ctrl.command.trigger == null || $ctrl.command.trigger === "") {
                    return;
                }

                $ctrl.close({
                    $value: {
                        action: "save",
                        command: $ctrl.command
                    }
                });
            };
        }
    });
}());
