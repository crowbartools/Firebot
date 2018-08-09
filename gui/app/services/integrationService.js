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
    .factory("integrationService", function(listenerService, logger) {
      let service = {};

      let integrations = [];

      let integrationsWaitingForConnectionUpdate = [];

      function addIntegrationToWaitingConnection(id) {
        if (!integrationsWaitingForConnectionUpdate.includes(id)) {
          integrationsWaitingForConnectionUpdate.push(id);
        }
      }

      function getIntegrationById(id) {
        return integrations.find(i => i.id === id);
      }

      service.updateIntegrations = function() {
        integrations = listenerService.fireEventSync(
          "getAllIntegrationDefinitions"
        );
      };

      service.getIntegrations = function() {
        return integrations;
      };

      service.oneIntegrationIsLinked = function() {
        return integrations.some(i => i.linked);
      };

      service.connectIntegration = function(id) {
        let integration = getIntegrationById(id);
        if (integration == null || integration.connected) return;
        addIntegrationToWaitingConnection(id);
        listenerService.fireEvent("connectIntegration", id);
      };

      service.disconnectIntegration = function(id) {
        let integration = getIntegrationById(id);
        if (integration == null || !integration.connected) return;
        addIntegrationToWaitingConnection(id);
        listenerService.fireEvent("disconnectIntegration", id);
      };

      service.toggleConnectionForIntegration = function(id) {
        let integration = getIntegrationById(id);
        if (integration == null || !integration.linked) return;
        addIntegrationToWaitingConnection(id);
        if (integration.connected) {
          service.disconnectIntegration(id);
        } else {
          service.connectIntegration(id);
        }
      };

      service.setConnectionForIntegration = function(
        integrationId,
        shouldConnect
      ) {
        return new Promise(resolve => {
          let listenerId = listenerService.registerListener(
            {
              type: listenerService.ListenerType.INTEGRATION_CONNECTION_UPDATE
            },
            data => {
              if (data.id === integrationId) {
                listenerService.unregisterListener(
                  listenerService.ListenerType.INTEGRATION_CONNECTION_UPDATE,
                  listenerId
                );
                resolve(data.connected);
              }
            }
          );

          if (shouldConnect) {
            service.connectIntegration(integrationId);
          } else {
            service.disconnectIntegration(integrationId);
          }
        });
      };

      service.integrationIsConnected = function(id) {
        let integration = getIntegrationById(id);
        if (integration == null) return false;
        return integration.connected === true;
      };

      service.integrationIsLinked = function(id) {
        console.log("got int is linked");
        let integration = getIntegrationById(id);
        if (integration == null) return false;
        console.log(integration.linked);
        return integration.linked === true;
      };

      service.integrationIsWaitingForConnectionUpdate = function(id) {
        return integrationsWaitingForConnectionUpdate.includes(id);
      };

      service.linkIntegration = function(id) {
        console.log("link service:");
        console.log(id);
        listenerService.fireEvent("linkIntegration", id);
      };

      service.unlinkIntegration = function(id) {
        listenerService.fireEvent("unlinkIntegration", id);
      };

      listenerService.registerListener(
        {
          type: listenerService.ListenerType.INTEGRATIONS_UPDATED
        },
        () => {
          service.updateIntegrations();
        }
      );

      listenerService.registerListener(
        {
          type: listenerService.ListenerType.INTEGRATION_CONNECTION_UPDATE
        },
        data => {
          let integration = integrations.find(i => i.id === data.id);
          if (integration != null) {
            integration.connected = data.connected;
          }

          integrationsWaitingForConnectionUpdate = integrationsWaitingForConnectionUpdate.filter(
            id => id !== data.id
          );
        }
      );

      return service;
    });
})();
