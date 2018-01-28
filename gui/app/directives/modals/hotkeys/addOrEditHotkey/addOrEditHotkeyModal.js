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
            controller: function(hotkeyService, commandsService, boardService) {
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
                    $ctrl.hotkey.action.metadata.effects = effects;
                };

                $ctrl.commands = commandsService.getAllCommands().map(c => {
                    return { id: c.commandID, trigger: c.trigger};
                });

                $ctrl.buttons = [];
                boardService.getAllBoards().forEach(b => {
                    Object.values(b.controls).forEach(c => {
                        $ctrl.buttons.push({
                            id: c.controlId,
                            text: c.text,
                            scene: c.scene,
                            board: {
                                id: b.versionId,
                                name: b.name
                            }
                        });
                    });
                });

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
                                metadata: {
                                    command: { id: "", trigger: ""},
                                    button: {},
                                    effects: []
                                }
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
