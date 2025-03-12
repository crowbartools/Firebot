"use strict";

(function() {
    angular.module("firebotApp").factory("currencyService", function(backendCommunicator) {
        const service = {};

        // The currency settings.
        service.currencies = Object.values(backendCommunicator.fireEventSync("currencies:get-currencies"));

        // This will get currency information.
        // Can pass option param to just get one currency, otherwise it gets all of them.
        service.getCurrencies = () => {
            return service.currencies;
        };

        service.getCurrency = (currencyId) => {
            return service.currencies.find(c => c.id === currencyId);
        };

        // Saved the currency modal.
        service.createCurrency = function(currency) {
            backendCommunicator.send("currencies:create-currency", currency);
        };

        // Updated a pre-existing currency through the modal.
        service.updateCurrency = function(currency) {
            backendCommunicator.send("currencies:update-currency", currency);
        };

        // Purged a currency through the modal.
        service.purgeCurrency = function(currency) {
            backendCommunicator.send("currencies:purge-currency", currency);
        };

        // Deleted a currency through the modal.
        service.deleteCurrency = (currency) => {
            backendCommunicator.send("currencies:delete-currency", currency);
        };

        backendCommunicator.on("currencies:currencies-updated", (currencies) => {
            service.currencies = Object.values(currencies);
        });

        return service;
    });
}());