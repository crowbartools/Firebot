"use strict";

(function() {
    angular.module("firebotApp").component("addOrEditHotkeyModal", {
        templateUrl:
      "./directives/modals/hotkeys/addOrEditHotkey/addOrEditHotkeyModal.html",
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&",
            modalInstance: "<"
        },
        controller: function(
            hotkeyService,
            ngToast
        ) {
            const $ctrl = this;

            $ctrl.onHotkeyCapture = function(hotkey) {
                $ctrl.hotkey.code = hotkey;
            };

            $ctrl.onAddVirtualButtonToHotkey = function() {
                const button = $ctrl.virtualBtn;
                if ($ctrl.hotkey.code != null && $ctrl.hotkey.code.length !== 0) {
                    if (!$ctrl.hotkey.code.includes(button)) {
                        $ctrl.hotkey.code += `+${button}`;
                    }
                } else {
                    $ctrl.hotkey.code = button;
                }
            };

            $ctrl.effectListUpdated = function(effects) {
                $ctrl.hotkey.effects = effects;
            };

            $ctrl.$onInit = function() {
                if ($ctrl.resolve.hotkey != null) {
                    $ctrl.hotkey = JSON.parse(JSON.stringify($ctrl.resolve.hotkey));
                }

                if ($ctrl.hotkey == null) {
                    $ctrl.isNewHotkey = true;

                    $ctrl.hotkey = {
                        name: "",
                        active: true,
                        code: ""
                    };
                }
            };

            $ctrl.delete = function() {
                if ($ctrl.isNewHotkey) {
                    return;
                }

                $ctrl.close({ $value: { hotkey: $ctrl.hotkey, action: "delete" } });
            };

            function hotkeyValid() {
                if ($ctrl.hotkey.name === "") {
                    ngToast.create("Please provide a name for the Hotkey.");
                    return false;
                }

                if ($ctrl.hotkey.code === "") {
                    ngToast.create("Please record a Hotkey.");
                    return false;
                }

                if (hotkeyService.hotkeyCodeExists($ctrl.hotkey.id, $ctrl.hotkey.code)) {
                    ngToast.create("This Hotkey already exists.");
                    return false;
                }

                return true;
            }

            $ctrl.save = function() {
                if (!hotkeyValid()) {
                    return;
                }

                const action = $ctrl.isNewHotkey ? "add" : "update";
                $ctrl.close({
                    $value: {
                        hotkey: $ctrl.hotkey,
                        action: action
                    }
                });
            };
        }
    });
}());