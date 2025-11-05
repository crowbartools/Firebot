"use strict";

(function() {
    angular
        .module("firebotApp")
        .controller("hotkeysController", function($scope, hotkeyService, utilityService) {
            $scope.hotkeyService = hotkeyService;

            $scope.onHotkeysUpdated = (items) => {
                hotkeyService.saveAllHotkeys(items);
            };

            $scope.headers = [
                {
                    name: "NAME",
                    icon: "fa-user",
                    dataField: "name",
                    sortable: true,
                    cellTemplate: `{{data.name}}`
                },
                {
                    name: "HOTKEY",
                    icon: "fa-keyboard",
                    dataField: "code",
                    cellTemplate: `
                        {{getDisplayForCode(data.code)}} 
                        <i 
                            ng-show="data.warning" 
                            class="fas fa-exclamation-circle ml-2" 
                            style="color: #fb7373;"
                            uib-tooltip="{{data.warning}}"
                        />
                    `,
                    cellController: ($scope) => {
                        $scope.getDisplayForCode = (code) => {
                            return hotkeyService.getDisplayFromAcceleratorCode(code);
                        };
                    }
                }
            ];

            $scope.hotkeyOptions = (item) => {
                const options = [
                    {
                        html: `<a href ><i class="far fa-pen mr-2 text-center" style="width: 20px;"></i> Edit</a>`,
                        click: () => {
                            hotkeyService.showAddEditHotkeyModal(item);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-toggle-off mr-2 text-center" style="width: 20px;"></i> ${item.active ? "Disable Hotkey" : "Enable Hotkey"}</a>`,
                        click: () => {
                            hotkeyService.toggleHotkeyActiveState(item);
                        }
                    },
                    {
                        html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt text-center mr-2" style="width: 20px;"></i> Delete</a>`,
                        click: () => {
                            utilityService
                                .showConfirmationModal({
                                    title: "Delete Hotkey",
                                    question: `Are you sure you want to delete the Hotkey "${item.name}"?`,
                                    confirmLabel: "Delete",
                                    confirmBtnType: "btn-danger"
                                })
                                .then((confirmed) => {
                                    if (confirmed) {
                                        hotkeyService.deleteHotkey(item.id);
                                    }
                                });

                        }
                    }
                ];

                return options;
            };
        });
}());