'use strict';

(function() {
    angular
        .module('firebotApp')
        .component("addOrEditHotkeyModal", {
            templateUrl: "./directives/modals/hotkeys/addOrEditHotkey/addOrEditHotkeyModal.html",
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            controller: function(hotkeyService) {
                let $ctrl = this;

                $ctrl.onHotkeyCapture = function(hotkey) {
                    $ctrl.hotkey.code = hotkey;
                };

                $ctrl.$onInit = function () {

                    if ($ctrl.resolve.hotkey != null) {
                        $ctrl.hotkey = JSON.parse(JSON.stringify($ctrl.resolve.hotkey));
                    }

                    if ($ctrl.hotkey == null) {
                        $ctrl.isNewHotkey = true;

                        $ctrl.hotkey = {
                            active: true,
                            code: "",
                            action: {
                                type: "Run Effects",
                                metadata: {}
                            }
                        };
                    }
                };

                $ctrl.delete = function() {
                    if ($ctrl.isNewHotkey) return;
                    $ctrl.close({ $value: { hotkey: $ctrl.hotkey, action: "delete"} });
                };

                $ctrl.save = function() {
                    if ($ctrl.hotkey.name == null || $ctrl.hotkey.name === "") return;
                    if (hotkeyService.hotkeyCodeExists($ctrl.hotkey.uuid, $ctrl.hotkey.code)) return;
                    let action = $ctrl.isNewHotkey ? 'add' : 'update';
                    $ctrl.close({ $value: {
                        hotkey: $ctrl.hotkey,
                        action: action
                    }});
                };
            }
        });
}());
