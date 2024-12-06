"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("pluginsService", function(backendCommunicator) {
            const service = {};

            let pluginConfigs = {};

            service.loadPlugins = function() {
                backendCommunicator
                    .fireEventAsync("plugin-manager:get-all-configs")
                    .then((configs) => {
                        if (configs != null) {
                            pluginConfigs = configs;
                        }
                    });
            };

            service.getPluginConfigs = function() {
                return Object.values(pluginConfigs);
            };

            service.getPluginConfig = function(pluginConfigId) {
                return pluginConfigs[pluginConfigId];
            };

            service.savePluginConfig = function(pluginConfig) {
                if (!pluginConfig) {
                    return;
                }

                pluginConfigs[pluginConfig.id] = pluginConfig;

                backendCommunicator.fireEvent("plugin-manager:save-config",
                    pluginConfig);
            };

            service.deletePluginConfig = function(pluginConfigId) {
                if (!pluginConfigId) {
                    return;
                }

                delete pluginConfigs[pluginConfigId];

                backendCommunicator.fireEvent("plugin-manager:delete",
                    pluginConfigId);
            };



            return service;
        });
}());