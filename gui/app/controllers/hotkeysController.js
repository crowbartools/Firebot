'use strict';
(function() {

    //This handles the Hotkeys tab

    angular
        .module('firebotApp')
        .controller('hotkeysController', function($scope, hotkeyService, utilityService) {

            $scope.getHotkeys = function() {
                return hotkeyService.getHotkeys();
            };

            $scope.getDisplayForCode = function(code) {
                return hotkeyService.getDisplayFromAcceleratorCode(code);
            };

            $scope.openAddOrEditHotkeyModal = function(hotkey) {
                utilityService.showModal({
                    component: "addOrEditHotkeyModal",
                    resolveObj: {
                        hotkey: () => hotkey
                    },
                    closeCallback: (resp) => {
                        let action = resp.action,
                            hotkey = resp.hotkey;

                        switch (action) {
                        case "add":
                            hotkeyService.saveHotkey(hotkey);
                            break;
                        case "update":
                            hotkeyService.updateHotkey(hotkey);
                            break;
                        case "delete":
                            hotkeyService.deleteHotkey(hotkey);
                            break;
                        }

                    }
                });
            };
        });
}());
