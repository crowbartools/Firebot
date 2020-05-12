"use strict";

// Basic template for a modal component, copy this and rename to build a modal.

(function() {
    angular.module("firebotApp").component("editCounterModal", {
        templateUrl: "./directives/modals/counters/editCounter/editCounterModal.html",
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&"
        },
        controller: function($rootScope, ngToast, countersService) {
            let $ctrl = this;

            $ctrl.txtFilePath = "";

            $ctrl.counter = null;

            $ctrl.saveToTxtFileChanged = () => {
                if ($ctrl.counter.saveToTxtFile) {
                    countersService.createTxtFileForCounter($ctrl.counter.id);
                } else {
                    countersService.deleteTxtFileForCounter($ctrl.counter.id);
                }
            };

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
            };
        }
    });
}());
