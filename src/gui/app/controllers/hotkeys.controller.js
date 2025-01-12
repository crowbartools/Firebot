"use strict";

(function() {
    //This handles the Hotkeys tab

    angular
        .module("firebotApp")
        .controller("hotkeysController", function(
            $scope,
            hotkeyService,
            utilityService
        ) {
            $scope.getHotkeys = function() {
                return hotkeyService.getHotkeys();
            };

            $scope.getDisplayForCode = function(code) {
                return hotkeyService.getDisplayFromAcceleratorCode(code);
            };

            $scope.openAddOrEditHotkeyModal = function(hotkey) {
                utilityService.showModal({
                    component: "addOrEditHotkeyModal",
                    breadcrumbName: "Edit Hotkey",
                    resolveObj: {
                        hotkey: () => hotkey
                    },
                    closeCallback: (resp) => {
                        const action = resp.action,
                            hotkey = resp.hotkey;

                        switch (action) {
                            case "add":
                                hotkeyService.addHotkey(hotkey);
                                break;
                            case "update":
                                hotkeyService.updateHotkey(hotkey);
                                break;
                            case "delete":
                                utilityService
                                    .showConfirmationModal({
                                        title: "Delete Hotkey",
                                        question: `Are you sure you want to delete the Hotkey "${hotkey.name}"?`,
                                        confirmLabel: "Delete",
                                        confirmBtnType: "btn-danger"
                                    })
                                    .then((confirmed) => {
                                        if (confirmed) {
                                            hotkeyService.deleteHotkey(hotkey);
                                        }
                                    });
                                break;
                        }
                    }
                });
            };
        });
}());