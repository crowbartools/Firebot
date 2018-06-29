"use strict";
const profileManager = require("../../lib/common/profile-manager.js");

(function() {
  // This provides methods for handling currency

  angular
    .module("firebotApp")
    .factory("currencyService", function($rootScope, utilityService, logger) {
      let service = {};

      service.saveCurrency = function(currency) {
        // currency modal saved.
      };

      service.updateCurrency = function(currency) {
        // currency modal edit
      };

      service.deleteCurrency = function(currency) {
        // currency deleted
      };

      return service;
    });
})(window.angular);
