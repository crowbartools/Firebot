"use strict";
(function() {
  //This handles the Currency tab

  angular
    .module("firebotApp")
    .controller("currencyController", function(
      $scope,
      utilityService,
      currencyService
    ) {
      $scope.openAddOrEditCurrency = function(currency) {
        utilityService.showModal({
          component: "addOrEditCurrencyModal",
          resolveObj: {
            currency: () => currency
          },
          closeCallback: resp => {
            let action = resp.action,
              currency = resp.currency;

            switch (action) {
              case "add":
                currencyService.saveCurrency(currency);
                break;
              case "update":
                currencyService.updateCurrency(currency);
                break;
              case "delete":
                currencyService.deleteCurrency(currency);
                break;
            }
          }
        });
      };
    });
})();
