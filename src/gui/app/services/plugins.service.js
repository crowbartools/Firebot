"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("pluginsService", function(backendCommunicator, modalFactory, $q) {
            const service = {};

            let installedPlugins = [];
            service.pendingFrontendReload = false;

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

            service.savePluginConfig = async (pluginConfig) => {
                if (!pluginConfig || !pluginConfig.id) {
                    return;
                }

                return await backendCommunicator.fireEventAsync("plugin-manager:save-config", { pluginConfig });
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

            service.searchCommunityPlugins = async (searchQuery) => {
                return await backendCommunicator.fireEventAsync("plugin-manager:search-community-plugins", searchQuery);
            };

            service.installCommunityPlugin = async (pluginDetails) => {
                return await backendCommunicator.fireEventAsync("plugin-manager:install-community-plugin", pluginDetails);
            };

            service.getScriptDetails = function(fileName, expectedScriptType) {
                return $q.when(
                    backendCommunicator.fireEventAsync("plugin-manager:get-plugin-details", { fileName, expectedScriptType })
                );
            };

            backendCommunicator.onAsync("plugin-manager:prompt-frontend-reload",
                async (data) => {
                    // Only show the reload prompt once. There's an indicator.
                    if (service.pendingFrontendReload !== true) {
                        modalFactory.showConfirmationModal({
                            title: "Reload Required",
                            question: `In order to fully update, disable, or uninstall the ${data.pluginName} plugin, you must reload the main Firebot window. Would you like to do that now?`,
                            tip: "NOTE: Firebot will continue running, but you will lose any unsaved changes in any currently open modals.",
                            cancelLabel: "No, Don't Reload",
                            cancelBtnType: "btn-default",
                            confirmLabel: "Yes, Reload Now"
                        }).then((confirmed) => {
                            if (confirmed) {
                                backendCommunicator.send("reload-main-window");
                            } else {
                                service.pendingFrontendReload = true;
                            }
                        });
                    }
                }
            );

            backendCommunicator.send("plugin-manager:ui-service-ready");

            return service;
        });
}());
