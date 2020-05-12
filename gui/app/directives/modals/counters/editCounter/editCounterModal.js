"use strict";

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

            $ctrl.triggerMeta = {};

            $ctrl.modalId = "Edit Counter";
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
            };
        }
    });
}());
