"use strict";

(function() {
    angular
        .module("firebotApp")
        .controller("gameControllersController", function($scope, gameControllerService, utilityService) {
            $scope.gameControllerService = gameControllerService;

            $scope.onBindingsUpdated = (items) => {
                gameControllerService.saveAllBindings(items);
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
                    name: "BUTTON",
                    icon: "fa-gamepad",
                    dataField: "button",
                    cellTemplate: `{{getButtonName(data.button)}}`,
                    cellController: ($scope) => {
                        $scope.getButtonName = button => gameControllerService.getButtonName(button);
                    }
                }
            ];

            $scope.bindingOptions = item => [
                {
                    html: `<a href><i class="far fa-pen mr-2 text-center" style="width: 20px;"></i> Edit</a>`,
                    click: () => gameControllerService.showAddEditBindingModal(item)
                },
                {
                    html: `<a href><i class="far fa-toggle-off mr-2 text-center" style="width: 20px;"></i> ${item.active ? "Disable" : "Enable"}</a>`,
                    click: () => gameControllerService.toggleBindingActiveState(item)
                },
                {
                    html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt text-center mr-2" style="width: 20px;"></i> Delete</a>`,
                    click: () => {
                        utilityService
                            .showConfirmationModal({
                                title: "Delete Game Controller Binding",
                                question: `Are you sure you want to delete the binding "${item.name}"?`,
                                confirmLabel: "Delete",
                                confirmBtnType: "btn-danger"
                            })
                            .then((confirmed) => {
                                if (confirmed) {
                                    gameControllerService.deleteBinding(item.id);
                                }
                            });
                    }
                }
            ];
        });
}());
