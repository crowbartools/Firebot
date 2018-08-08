"use strict";

(function() {
  // This handles logins and connections to mixer interactive

  const electronOauth2 = require("electron-oauth2");
  const profileManager = require("../../lib/common/profile-manager.js");
  const dataAccess = require("../../lib/common/data-access.js");
  const { session } = require("electron").remote;
  const request = require("request");

  angular
    .module("firebotApp")
    .factory("integrationService", function(
      listenerService,
      settingsService,
      soundService,
      utilityService,
      $q,
      $rootScope,
      boardService,
      logger
    ) {
      let service = {};

      let integrations = [];

      service.updateIntegrations = function() {
        integrations = listenerService.fireEventSync(
          "getAllIntegrationDefinitions"
        );
      };

      service.getIntegrations = function() {
        return integrations;
      };

      service.oneIntegrationIsLinked = function() {
        return integrations.some(i => e.linked);
      };

      service.integrationIsConnected = function(id) {
        let integration = integrations[id];
        if (integration == null) return false;
        return integration.connected === true;
      };

      service.linkService = function(id) {
        listenerService.fireEvent("linkIntegration", id);
      };

      return service;
    });
})();
