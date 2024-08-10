"use strict";
(function() {
    angular
        .module("firebotApp")
        .controller("countersController", function($scope, countersService, utilityService) {

            $scope.countersService = countersService;

            $scope.onCountersUpdated = (items) => {
                countersService.saveAllCounters(items);
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
                    name: "VALUE",
                    icon: "fa-tally",
                    dataField: "value",
                    sortable: true,
                    cellTemplate: `{{data.value}}`
                },
                {
                    name: "MINIMUM",
                    icon: "fa-arrow-to-bottom",
                    dataField: "minimum",
                    sortable: true,
                    cellTemplate: `{{data.minimum ? data.minimum : 'n/a'}}`
                },
                {
                    name: "MAXIMUM",
                    icon: "fa-arrow-to-top",
                    dataField: "maximum",
                    sortable: true,
                    cellTemplate: `{{data.maximum ? data.maximum : 'n/a'}}`
                }
            ];

            $scope.counterOptions = (item) => {
                const options = [
                    {
                        html: `<a href ><i class="far fa-pen" style="margin-right: 10px;"></i> Edit</a>`,
                        click: () => {
                            countersService.showAddEditCounterModal(item);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-clone" style="margin-right: 10px;"></i> Duplicate</a>`,
                        click: () => {
                            countersService.duplicateCounter(item.id);
                        }
                    },
                    {
                        html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete</a>`,
                        click: () => {
                            utilityService
                                .showConfirmationModal({
                                    title: "Delete Counter",
                                    question: `Are you sure you want to delete the Counter "${item.name}"?`,
                                    confirmLabel: "Delete",
                                    confirmBtnType: "btn-danger"
                                })
                                .then(confirmed => {
                                    if (confirmed) {
                                        countersService.deleteCounter(item.id);
                                    }
                                });

                        }
                    }
                ];

                return options;
            };

            $scope.openRenameCounterModal = function(counter) {
                utilityService.openGetInputModal(
                    {
                        model: counter.name,
                        label: "Rename Counter",
                        saveText: "Save",
                        validationFn: (value) => {
                            return new Promise(resolve => {
                                if (value == null || value.trim().length < 1) {
                                    resolve(false);
                                } else if (countersService.counterNameExists(value)) {
                                    resolve(false);
                                } else {
                                    resolve(true);
                                }
                            });
                        },
                        validationText: "Counter name cannot be empty and must be unique."
                    },
                    (newName) => {
                        counter.name = newName;
                        countersService.renameCounter(counter.id, newName);
                    });
            };
        });
}());
