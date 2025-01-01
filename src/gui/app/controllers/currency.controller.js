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
            $scope.currencyService = currencyService;

            // Open currency modal.
            $scope.openAddOrEditCurrencyModal = function(currency) {
                utilityService.showModal({
                    component: "addOrEditCurrencyModal",
                    resolveObj: {
                        currency: () => currency
                    },
                    closeCallback: (resp) => {
                        const action = resp.action,
                            currency = resp.currency;

                        switch (action) {
                            case "add":
                                currencyService.createCurrency(currency);
                                break;
                            case "update":
                                currencyService.updateCurrency(currency);
                                break;
                            case "delete":
                                currencyService.deleteCurrency(currency);
                                break;
                            case "purge":
                                currencyService.purgeCurrency(currency);
                                break;
                            default:
                        }
                    }
                });
            };
        });
}());