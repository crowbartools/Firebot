"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("pluginsService", function(backendCommunicator, $q) {
            const service = {};

            let installedPlugins = [];

            backendCommunicator.on("plugin-manager:all-plugins", (plugins) => {
                installedPlugins = Array.isArray(plugins) ? plugins : [];
                return installedPlugins;
            });

            service.loadPlugins = function() {
                backendCommunicator.send("plugin-manager:ui-service-ready");
            };

            service.getInstalledPlugins = function() {
                return installedPlugins;
            };

            service.getPluginById = function(id) {
                return installedPlugins.find(p => p.config && p.config.id === id);
            };

            service.savePluginConfig = function(pluginConfig, isNewInstall = false) {
                if (!pluginConfig || !pluginConfig.id) {
                    return $q.resolve(false);
                }
                return $q.when(
                    backendCommunicator.fireEventAsync("plugin-manager:save-config", { pluginConfig, isNewInstall })
                );
            };

            service.deletePlugin = function(pluginId, deletePluginFile = false) {
                if (!pluginId) {
                    return;
                }

                backendCommunicator.send("plugin-manager:delete", {
                    id: pluginId,
                    deletePluginFile: deletePluginFile === true
                });
            };

            service.setPluginEnabled = function(pluginId, enabled) {
                if (!pluginId) {
                    return;
                }

                backendCommunicator.send("plugin-manager:set-enabled", {
                    id: pluginId,
                    enabled: enabled === true
                });
            };

            /**
             * Validate + copy a .js file from disk into the user's scripts folder
             */
            service.installPluginFromFile = function(filePath, overwrite = false) {
                return $q.when(
                    backendCommunicator.fireEventAsync("plugin-manager:install-from-file", {
                        filePath,
                        overwrite: overwrite === true
                    })
                );
            };

            service.updatePluginFromFile = function(pluginId, filePath, overwrite = false) {
                return $q.when(
                    backendCommunicator.fireEventAsync("plugin-manager:update-from-file", {
                        pluginId,
                        filePath,
                        overwrite: overwrite === true
                    })
                );
            };

            service.cancelInstall = function(fileName) {
                if (!fileName) {
                    return;
                }

                backendCommunicator.send("plugin-manager:cancel-install", { fileName });
            };

            service.getScriptDetails = function(fileName, expectedScriptType) {
                return $q.when(
                    backendCommunicator.fireEventAsync("plugin-manager:get-plugin-details", { fileName, expectedScriptType })
                );
            };

            backendCommunicator.send("plugin-manager:ui-service-ready");

            return service;
        });
}());
