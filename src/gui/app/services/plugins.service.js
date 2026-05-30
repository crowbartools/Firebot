"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("pluginsService", function(backendCommunicator, $q) {
            const service = {};

            let installedPlugins = [];

            service.loadPlugins = function() {
                return $q.when(
                    backendCommunicator.fireEventAsync("script-manager:get-installed-plugins")
                ).then((plugins) => {
                    installedPlugins = Array.isArray(plugins) ? plugins : [];
                    return installedPlugins;
                });
            };

            service.reloadPlugins = service.loadPlugins;

            service.getInstalledPlugins = function() {
                return installedPlugins;
            };

            service.getPluginById = function(id) {
                return installedPlugins.find(p => p.config && p.config.id === id);
            };

            service.savePluginConfig = function(pluginConfig) {
                if (!pluginConfig || !pluginConfig.id) {
                    return $q.resolve(false);
                }
                return $q.when(
                    backendCommunicator.fireEventAsync("plugin-manager:save-config", pluginConfig)
                ).then(() => service.loadPlugins());
            };

            /**
             * Saves the config and waits for the plugin to (re)load on the backend before resolving
             */
            service.reloadPlugin = function(pluginConfig) {
                if (!pluginConfig || !pluginConfig.id) {
                    return $q.resolve(false);
                }
                return $q.when(
                    backendCommunicator.fireEventAsync("plugin-manager:reload", pluginConfig)
                ).then(() => service.loadPlugins());
            };

            service.deletePlugin = function(pluginId, deleteScriptFile = false) {
                if (!pluginId) {
                    return $q.resolve(false);
                }
                return $q.when(
                    backendCommunicator.fireEventAsync("plugin-manager:delete", {
                        id: pluginId,
                        deleteScriptFile: deleteScriptFile === true
                    })
                ).then(() => service.loadPlugins());
            };

            service.setPluginEnabled = function(pluginId, enabled) {
                if (!pluginId) {
                    return $q.resolve(false);
                }
                return $q.when(
                    backendCommunicator.fireEventAsync("plugin-manager:set-enabled", {
                        id: pluginId,
                        enabled: enabled === true
                    })
                ).then(() => service.loadPlugins());
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
                    return $q.resolve();
                }
                return $q.when(
                    backendCommunicator.fireEventAsync("plugin-manager:cancel-install", { fileName })
                );
            };

            service.getScriptDetails = function(fileName, expectedScriptType) {
                return $q.when(
                    backendCommunicator.fireEventAsync("script-manager:get-script-details", { fileName, expectedScriptType })
                );
            };

            return service;
        });
}());
