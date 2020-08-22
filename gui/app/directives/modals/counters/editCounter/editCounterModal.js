"use strict";

(function() {
    angular.module("firebotApp").component("editCounterModal", {
        templateUrl: "./directives/modals/counters/editCounter/editCounterModal.html",
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&",
            modalInstance: "<"
        },
        controller: function($rootScope, $scope, ngToast, countersService, utilityService) {
            let $ctrl = this;

            $ctrl.txtFilePath = "";

            $ctrl.counter = null;

            $ctrl.copyTxtFilePath = function() {
                $rootScope.copyTextToClipboard($ctrl.txtFilePath);

                ngToast.create({
                    className: 'success',
                    content: 'Counter txt file path copied!'
                });
            };

            $ctrl.delete = function() {
                $ctrl.close({
                    $value: {
                        action: "delete",
                        counter: $ctrl.counter
                    }
                });
            };

            $ctrl.save = function() {
                $ctrl.close({
                    $value: {
                        action: "update",
                        counter: $ctrl.counter
                    }
                });
            };

            $ctrl.valueIsNull = (value) => value === undefined || value === null;

            $ctrl.editMinimum = () => {
                utilityService.openGetInputModal(
                    {
                        model: $ctrl.counter.minimum,
                        inputType: "number",
                        label: "Set Minimum",
                        saveText: "Save",
                        descriptionText: "Set the minimum value this counter can be (optional).",
                        inputPlaceholder: "Enter number",
                        validationFn: (value) => {
                            return new Promise(resolve => {
                                if (!$ctrl.valueIsNull(value)) {
                                    if (!$ctrl.valueIsNull($ctrl.counter.maximum) && value >= $ctrl.counter.maximum) {
                                        return resolve({
                                            success: false,
                                            reason: `Minimum cannot be greater than or equal to the maximum (${$ctrl.counter.maximum}).`
                                        });
                                    }
                                }
                                resolve(true);
                            });
                        }
                    },
                    (editedValue) => {
                        $ctrl.counter.minimum = editedValue;
                        if (!$ctrl.valueIsNull(editedValue) && $ctrl.counter.value < $ctrl.counter.minimum) {
                            $ctrl.counter.value = $ctrl.counter.minimum;
                        }
                    }
                );
            };

            $ctrl.editMaximum = () => {
                utilityService.openGetInputModal(
                    {
                        model: $ctrl.counter.maximum,
                        inputType: "number",
                        label: "Set Maximum",
                        saveText: "Save",
                        descriptionText: "Set the maximum value this counter can be (optional).",
                        inputPlaceholder: "Enter number",
                        validationFn: (value) => {
                            return new Promise(resolve => {
                                if (!$ctrl.valueIsNull(value)) {
                                    if (!$ctrl.valueIsNull($ctrl.counter.minimum) && value <= $ctrl.counter.minimum) {
                                        return resolve({
                                            success: false,
                                            reason: `Maximum cannot be less than or equal to the minimum (${$ctrl.counter.minimum}).`
                                        });
                                    }
                                }

                                resolve(true);
                            });
                        }
                    },
                    (editedValue) => {
                        $ctrl.counter.maximum = editedValue;
                        if (!$ctrl.valueIsNull(editedValue) && $ctrl.counter.value > $ctrl.counter.maximum) {
                            $ctrl.counter.value = $ctrl.counter.maximum;
                        }
                    }
                );
            };

            $ctrl.editCurrentValue = () => {
                utilityService.openGetInputModal(
                    {
                        model: $ctrl.counter.value,
                        inputType: "number",
                        label: "Set Current Value",
                        saveText: "Save",
                        descriptionText: "Update the current value for this counter.",
                        inputPlaceholder: "Enter number",
                        validationFn: (value) => {
                            return new Promise(resolve => {
                                if (value == null) {
                                    return resolve({
                                        success: false,
                                        reason: `Counter value cannot be empty.`
                                    });
                                }
                                if (!$ctrl.valueIsNull($ctrl.counter.minimum) && value < $ctrl.counter.minimum) {
                                    return resolve({
                                        success: false,
                                        reason: `Counter value cannot be less than the minimum (${$ctrl.counter.minimum}).`
                                    });
                                } else if (!$ctrl.valueIsNull($ctrl.counter.maximum) && value > $ctrl.counter.maximum) {
                                    return resolve({
                                        success: false,
                                        reason: `Counter value cannot be greater than the maximum (${$ctrl.counter.maximum}).`
                                    });
                                }
                                resolve(true);
                            });
                        }
                    },
                    (editedValue) => {
                        $ctrl.counter.value = editedValue;
                    }
                );
            };

            $ctrl.updateEffectsListUpdated = function(effects) {
                $ctrl.counter.updateEffects = effects;
            };
            $ctrl.maximumEffectsListUpdated = function(effects) {
                $ctrl.counter.maximumEffects = effects;
            };
            $ctrl.minimumEffectsListUpdated = function(effects) {
                $ctrl.counter.minimumEffects = effects;
            };

            $ctrl.$onInit = function() {
                if ($ctrl.resolve.counter == null) {
                    ngToast.create({
                        className: 'danger',
                        content: 'Unable to edit counter!'
                    });
                    $ctrl.dismiss();
                    return;
                }

                // doing the json stuff is a realatively simple way to deep copy a command object.
                $ctrl.counter = JSON.parse(JSON.stringify($ctrl.resolve.counter));

                $ctrl.txtFilePath = countersService.getTxtFilePath($ctrl.counter.name);

                let modalId = $ctrl.resolve.modalId;
                $ctrl.modalId = modalId;
                utilityService.addSlidingModal(
                    $ctrl.modalInstance.rendered.then(() => {
                        let modalElement = $("." + modalId).children();
                        return {
                            element: modalElement,
                            name: "Edit Counter",
                            id: modalId,
                            instance: $ctrl.modalInstance
                        };
                    })
                );

                $scope.$on("modal.closing", function() {
                    utilityService.removeSlidingModal();
                });
            };
        }
    });
}());
