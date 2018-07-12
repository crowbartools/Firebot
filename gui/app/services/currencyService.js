"use strict";

(function() {
  //This handles events
  const profileManager = require("../../lib/common/profile-manager.js");
  const { ipcRenderer } = require("electron");

  angular.module("firebotApp").factory("currencyService", function(logger) {
    let service = {};

    // The currency settings.
    let currencyDb = profileManager.getJsonDbInProfile("/currency/currency");

    // This will get currency information.
    // Can pass option param to just get one currency, otherwise it gets all of them.
    service.getCurrencies = function(currencyId) {
      // If we have an optional param return settings for that currency.
      if (currencyId != null) {
        try {
          return currencyDb.getData("/" + currencyId);
        } catch (err) {
          logger.error(err);
          return;
        }
      }

      // If no param, just return all currency data.
      let currencies = [],
        currencyData = currencyDb.getData("/");

      Object.keys(currencyData).forEach(function(k) {
        currencies.push(currencyData[k]);
      });

      return currencies;
    };

    // Saved the currency modal.
    service.saveCurrency = function(currency) {
      let currencyId = currency.id;
      currencyDb.push("/" + currencyId, currency);
      ipcRenderer.send("createCurrency", currencyId);
      ipcRenderer.send("refreshCurrencyCache");
    };

    // Updated a pre-existing currency through the modal.
    service.updateCurrency = function(currency) {
      let currencyId = currency.id;
      currencyDb.push("/" + currencyId, currency);
      ipcRenderer.send("refreshCurrencyCache");
    };

    // Purged a currency through the modal.
    service.purgeCurrency = function(currencyId) {
      ipcRenderer.send("purgeCurrency", currencyId);
    };

    // Deleted a currency through the modal.
    service.deleteCurrency = function(currency) {
      let currencyId = currency.id;
      currencyDb.delete("/" + currencyId);
      ipcRenderer.send("deleteCurrency", currencyId);
      ipcRenderer.send("refreshCurrencyCache");
    };

    return service;
  });
})();
