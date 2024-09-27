"use strict";

// Modal for adding or editing a currency

(function() {
    angular.module("firebotApp").component("addOrEditCurrencyModal", {
        templateUrl:
      "./directives/modals/currency/addOrEditCurrency/addOrEditCurrency.html",
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&",
            modalInstance: "<"
        },
        controller: function($scope, utilityService, currencyService, viewerRolesService, logger) {
            const uuidv1 = require("uuid/v1");
            const $ctrl = this;

            $ctrl.currency = {
                id: uuidv1(),
                name: "Points",
                active: true,
                payout: 5,
                interval: 5,
                limit: 0,
                transfer: "Allow",
                bonus: {}
            };

            $ctrl.$onInit = function() {
                if ($ctrl.resolve.currency == null) {
                    $ctrl.isNewCurrency = true;
                } else {
                    $ctrl.currency = JSON.parse(JSON.stringify($ctrl.resolve.currency));
                }

                // Set our transfer status.
                $ctrl.setTransferEnabled = function(state) {
                    $ctrl.currency.transfer = state;
                };

                // Get the groups we want people to be able to give bonus currency to...
                $ctrl.viewerRoles = viewerRolesService.getAllRoles().filter(r => r.id !== "Owner");
            };

            $ctrl.delete = function() {
                if ($ctrl.isNewCurrency) {
                    return;
                }

                $ctrl.close({ $value: { currency: $ctrl.currency, action: "delete" } });
            };

            $ctrl.save = function() {
                if ($ctrl.currency.name == null || $ctrl.currency.name === "") {
                    return;
                }

                if (!$ctrl.currency.offline) {
                    $ctrl.currency.offline = undefined;
                }

                logger.debug($ctrl.currency);

                const action = $ctrl.isNewCurrency ? "add" : "update";
                $ctrl.close({
                    $value: {
                        currency: $ctrl.currency,
                        action: action
                    }
                });
            };

            /**
             * Delete Currency confirmation Modal
             */
            $ctrl.showCurrencyDeleteModal = function(currency) {
                utilityService
                    .showConfirmationModal({
                        title: "Delete Currency",
                        question: "Are you sure you'd like to delete this currency?",
                        confirmLabel: "Delete"
                    })
                    .then((confirmed) => {
                        if (confirmed) {
                            currencyService.deleteCurrency(currency);
                            $ctrl.close({
                                $value: {
                                    action: "close"
                                }
                            });
                        }
                    });
            };

            /**
             * Purge Currency confirmation Modal
             */
            $ctrl.showCurrencyPurgeModal = function(currency) {
                utilityService
                    .showConfirmationModal({
                        title: "Purge Currency",
                        question:
              "Are you sure you'd like to purge this currency? This currency will be set to 0 for all users.",
                        confirmLabel: "Purge"
                    })
                    .then((confirmed) => {
                        if (confirmed) {
                            currencyService.purgeCurrency(currency.id);
                            $ctrl.close({
                                $value: {
                                    action: "close"
                                }
                            });
                        }
                    });
            };
        }
    });
}());
