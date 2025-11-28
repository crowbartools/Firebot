"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("pluginsService", function(backendCommunicator) {
            const service = {};

            let installedPlugins = [];

            service.loadPlugins = function() {
                backendCommunicator
                    .fireEventAsync("script-manager:get-installed-plugins")
                    .then((plugins) => {
                        if (plugins != null) {
                            installedPlugins = plugins;
                        }
                    });
            };

            service.getPluginConfigs = function() {
                return Object.values(installedPlugins);
            };

            service.getPluginConfig = function(pluginConfigId) {
                return installedPlugins[pluginConfigId];
            };

            service.savePluginConfig = function(pluginConfig) {
                if (!pluginConfig) {
                    return;
                }

                installedPlugins[pluginConfig.id] = pluginConfig;

                backendCommunicator.fireEvent("plugin-manager:save-config",
                    pluginConfig);
            };

            service.deletePluginConfig = function(pluginConfigId) {
                if (!pluginConfigId) {
                    return;
                }

                delete installedPlugins[pluginConfigId];

                backendCommunicator.fireEvent("plugin-manager:delete",
                    pluginConfigId);
            };



            return service;
        });
}());