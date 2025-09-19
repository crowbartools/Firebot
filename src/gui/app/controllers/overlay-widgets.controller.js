"use strict";

(function() {
    angular
        .module("firebotApp")
        .controller("overlayWidgetsController", function($scope, overlayWidgetsService, modalFactory) {
            $scope.overlayWidgetsService = overlayWidgetsService;

            $scope.onOverlayWidgetConfigsUpdated = (items) => {
                overlayWidgetsService.saveAllOverlayWidgetConfigs(items);
            };

            $scope.headers = [
                {
                    name: "NAME",
                    icon: "fa-tag",
                    dataField: "name",
                    sortable: true,
                    cellTemplate: `{{data.name}}`,
                    cellController: () => {}
                },
                {
                    name: "TYPE",
                    icon: "fa-exclamation-square",
                    headerStyles: {
                        'min-width': '100px'
                    },
                    dataField: "type",
                    sortable: true,
                    cellTemplate: `{{typeName}}`,
                    cellController: ($scope) => {
                        $scope.typeName = "No Type";
                        if ($scope.data?.type) {
                            const widgetType = overlayWidgetsService.overlayWidgetTypes.find(t => t.id === $scope.data.type);
                            $scope.typeName = widgetType?.name ?? "Unknown Type";
                        }
                    }
                }
            ];

            $scope.contextMenuOptions = (item) => {
                const options = [
                    {
                        html: `<a href ><i class="far fa-pen" style="margin-right: 10px;"></i> Edit</a>`,
                        click: function () {
                            overlayWidgetsService.showAddOrEditOverlayWidgetModal(item);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-toggle-off" style="margin-right: 10px;"></i> ${!item.active ? "Enable Overlay Widget" : "Disable Overlay Widget"}</a>`,
                        click: function () {
                            overlayWidgetsService.toggleOverlayWidgetConfig(item.id);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-clone" style="margin-right: 10px;"></i> Duplicate</a>`,
                        click: function () {
                            overlayWidgetsService.duplicateOverlayWidget(item.id);
                        }
                    },
                    {
                        html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete</a>`,
                        click: function () {
                            modalFactory
                                .showConfirmationModal({
                                    title: "Delete Overlay Widget",
                                    question: `Are you sure you want to delete the Overlay Widget "${item.name}"?`,
                                    confirmLabel: "Delete",
                                    confirmBtnType: "btn-danger"
                                })
                                .then((confirmed) => {
                                    if (confirmed) {
                                        overlayWidgetsService.deleteOverlayWidgetConfig(item.id);
                                    }
                                });
                        }
                    }
                ];

                return options;
            };
        });
}());


