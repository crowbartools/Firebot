"use strict";

(function () {
    angular.module("firebotApp").component("editSystemCommandModal", {
        templateUrl: "./directives/modals/commands/editSystemCommand/editSystemCommandModal.html",
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&",
            modalInstance: "<"
        },
        controller: function () {
            const $ctrl = this;

            $ctrl.command = {};

            $ctrl.command.allowTriggerBySharedChat = String($ctrl.command.allowTriggerBySharedChat);

            $ctrl.sharedChatRadioOptions = {
                true: "Allow",
                false: "Ignore",
                inherit: { text: "Inherit", tooltip: "Inherit settings from Settings > Triggers > Allow Shared Chat To Trigger Commands" }
            };

            $ctrl.$onInit = function () {
                if ($ctrl.resolve.command != null) {
                    // doing the json stuff is a relatively simple way to deep copy a command object.
                    $ctrl.command = JSON.parse(JSON.stringify($ctrl.resolve.command));
                }

                if ($ctrl.command != null && $ctrl.command.allowTriggerBySharedChat == null) {
                    $ctrl.command.allowTriggerBySharedChat = "inherit";
                }
                $ctrl.command.allowTriggerBySharedChat = String($ctrl.command.allowTriggerBySharedChat);
            };

            $ctrl.effectListUpdated = function (effects) {
                $ctrl.command.effects = effects;
            };

            $ctrl.reset = function () {
                $ctrl.close({
                    $value: {
                        action: "reset",
                        command: $ctrl.command
                    }
                });
            };
            $ctrl.save = function () {
                if ($ctrl.command.trigger == null || $ctrl.command.trigger === "") {
                    return;
                }

                if ($ctrl.command.allowTriggerBySharedChat === "true") {
                    $ctrl.command.allowTriggerBySharedChat = true;
                } else if ($ctrl.command.allowTriggerBySharedChat === "false") {
                    $ctrl.command.allowTriggerBySharedChat = false;
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
