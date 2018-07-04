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
    controller: function($scope, utilityService, currencyService) {
      const uuidv1 = require("uuid/v1");
      let $ctrl = this;

      $ctrl.currency = {
        id: uuidv1(),
        name: "Points",
        active: true,
        payout: 5,
        interval: 5,
        limit: 10000,
        transfer: "Allow"
      };

      $ctrl.$onInit = function() {
        if ($ctrl.resolve.currency == null) {
          $ctrl.isNewCurrency = true;
        } else {
          $ctrl.currency = JSON.parse(JSON.stringify($ctrl.resolve.currency));
        }

        let modalId = $ctrl.resolve.modalId;
        utilityService.addSlidingModal(
          $ctrl.modalInstance.rendered.then(() => {
            let modalElement = $("." + modalId).children();
            return {
              element: modalElement,
              name: "Edit Currency",
              id: modalId,
              instance: $ctrl.modalInstance
            };
          })
        );

        $ctrl.setTransferEnabled = function(state) {
          $ctrl.currency.transfer = state;
        };

        $scope.$on("modal.closing", function() {
          utilityService.removeSlidingModal();
        });
      };

      $ctrl.delete = function() {
        if ($ctrl.isNewCurrency) return;
        $ctrl.close({ $value: { currency: $ctrl.currency, action: "delete" } });
      };

      $ctrl.save = function() {
        if ($ctrl.currency.name == null || $ctrl.currency.name === "") return;

        let action = $ctrl.isNewCurrency ? "add" : "update";
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
          .then(confirmed => {
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
              "Are you sure you'd like to purge this currency? All points for all users will be lost.",
            confirmLabel: "Purge"
          })
          .then(confirmed => {
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
})();
