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
            $scope,
            hotkeyService,
            commandsService,
            boardService,
            utilityService
        ) {
            let $ctrl = this;

            $ctrl.onHotkeyCapture = function(hotkey) {
                $ctrl.hotkey.code = hotkey;
            };

            $ctrl.onAddVirtualButtonToHotkey = function() {
                let button = $ctrl.virtualBtn;
                if ($ctrl.hotkey.code != null && $ctrl.hotkey.code.length !== 0) {
                    if (!$ctrl.hotkey.code.includes(button)) {
                        $ctrl.hotkey.code += "+" + button;
                    }
                } else {
                    $ctrl.hotkey.code = button;
                }
            };

            $ctrl.effectListUpdated = function(effects) {
                $ctrl.hotkey.effects = effects;
            };

            $ctrl.$onInit = function() {
                let modalId = $ctrl.resolve.modalId;
                utilityService.addSlidingModal(
                    $ctrl.modalInstance.rendered.then(() => {
                        let modalElement = $("." + modalId).children();
                        return {
                            element: modalElement,
                            name: "Edit Hotkey",
                            id: modalId,
                            instance: $ctrl.modalInstance
                        };
                    })
                );

                $scope.$on("modal.closing", function() {
                    utilityService.removeSlidingModal();
                });

                if ($ctrl.resolve.hotkey != null) {
                    $ctrl.hotkey = JSON.parse(JSON.stringify($ctrl.resolve.hotkey));
                }

                if ($ctrl.hotkey == null) {
                    $ctrl.isNewHotkey = true;

                    $ctrl.hotkey = {
                        active: true,
                        code: ""
                    };
                }
            };

            $ctrl.delete = function() {
                if ($ctrl.isNewHotkey) return;
                $ctrl.close({ $value: { hotkey: $ctrl.hotkey, action: "delete" } });
            };

            $ctrl.save = function() {
                if ($ctrl.hotkey.name == null || $ctrl.hotkey.name === "") return;
                if ($ctrl.hotkey.code == null || $ctrl.hotkey.code === "") return;
                if (hotkeyService.hotkeyCodeExists($ctrl.hotkey.id, $ctrl.hotkey.code)) return;
                let action = $ctrl.isNewHotkey ? "add" : "update";
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
