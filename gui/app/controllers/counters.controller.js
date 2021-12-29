"use strict";
(function() {
    angular
        .module("firebotApp")
        .controller("countersController", function($scope, countersService, utilityService) {

            $scope.countersService = countersService;

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


            $scope.openCreateCounterModal = function() {
                utilityService.openGetInputModal(
                    {
                        model: "",
                        label: "Create Counter",
                        inputPlaceholder: "Enter counter name",
                        saveText: "Create",
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
                    (name) => {
                        countersService.createCounter(name);
                    });
            };

            $scope.openEditCounterModal = function(counter) {
                utilityService.showModal({
                    component: "editCounterModal",
                    windowClass: "no-padding-modal",
                    resolveObj: {
                        counter: () => counter
                    },
                    closeCallback: resp => {
                        const { action, counter } = resp;

                        switch (action) {
                        case "update":
                            countersService.saveCounter(counter);
                            break;
                        case "delete":
                            countersService.deleteCounter(counter.id);
                            break;
                        }
                    }
                });
            };

            $scope.openDeleteCounterModal = (counter) => {
                utilityService
                    .showConfirmationModal({
                        title: "Delete",
                        question: `Are you sure you want to delete the Counter "${counter.name}"?`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    })
                    .then(confirmed => {
                        if (confirmed) {
                            countersService.deleteCounter(counter.id);
                        }
                    });
            };
        });
}());
