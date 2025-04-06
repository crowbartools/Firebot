"use strict";
(function () {
    //This handles settings access for frontend

    angular
        .module("firebotApp")
        .factory("settingsService", function (utilityService, backendCommunicator) {
            const service = {};

            let settingPathCache = {};
            let settingsCache = {};

            /** @param {string} settingName */
            function getSettingPath(settingName) {
                if (settingPathCache[settingName] == null) {
                    settingPathCache[settingName] = backendCommunicator.fireEventSync("settings:get-setting-path", settingName);
                }

                return settingPathCache[settingName];
            }

            function getPluginSettingPath(pluginName, settingName) {
                const key = `${pluginName}:${settingName}`;
                if (settingPathCache[key] == null) {
                    settingPathCache[key] = backendCommunicator.fireEventSync("settings:get-plugin-setting-path", { pluginName, settingName });
                }

                return settingPathCache[key];
            }

            backendCommunicator.on("settings:setting-updated", ({ settingPath, data }) => {
                if (settingPath == null || settingPath === "") {
                    return;
                }

                settingsCache[settingPath] = data;
            });

            backendCommunicator.on("settings:setting-deleted", (settingPath) => {
                delete settingsCache[settingPath];
            });

            backendCommunicator.on("settings:settings-cache-flushed", () => {
                settingPathCache = {};
                settingsCache = {};
            });

            service.getSetting = function (settingName, forceCacheUpdate = false) {
                const settingPath = getSettingPath(settingName);

                if (settingsCache[settingPath] == null || forceCacheUpdate === true) {
                    settingsCache[settingPath] = backendCommunicator.fireEventSync("settings:get-setting", settingName);
                }

                return settingsCache[settingPath];
            };

            service.saveSetting = function (settingName, data) {
                backendCommunicator.fireEvent("settings:save-setting", {
                    settingName,
                    data
                });
            };

            service.deleteSetting = function (settingName) {
                backendCommunicator.fireEventAsync("settings:delete-setting", settingName);
            };

            service.getPluginSetting = function (pluginName, settingName) {
                if (pluginName == null || typeof pluginName !== "string" || pluginName.trim() === "") {
                    throw new Error("getPluginSetting called with empty or invalid pluginName");
                }

                if (settingName == null || typeof settingName !== "string" || settingName.trim() === "") {
                    throw new Error("getPluginSetting called with empty or invalid settingName");
                }

                const settingPath = getPluginSettingPath(pluginName, settingName);

                if (settingsCache[settingPath] == null) {
                    settingsCache[settingPath] = backendCommunicator.fireEventSync("settings:get-plugin-setting", { pluginName, settingName });
                }

                return settingsCache[settingPath];
            };

            service.savePluginSetting = function (pluginName, settingName, data) {
                if (pluginName == null || typeof pluginName !== "string" || pluginName.trim() === "") {
                    throw new Error("savePluginSetting called with empty or invalid pluginName");
                }

                if (settingName == null || typeof settingName !== "string" || settingName.trim() === "") {
                    throw new Error("savePluginSetting called with empty or invalid settingName");
                }

                backendCommunicator.fireEvent("settings:save-plugin-setting", {
                    pluginName,
                    settingName,
                    data
                });
            };

            service.deletePluginSetting = function (pluginName, settingName) {
                if (pluginName == null || typeof pluginName !== "string" || pluginName.trim() === "") {
                    throw new Error("deletePluginSetting called with empty or invalid pluginName");
                }

                if (settingName == null || typeof settingName !== "string" || settingName.trim() === "") {
                    throw new Error("deletePluginSetting called with empty or invalid settingName");
                }

                backendCommunicator.fireEventAsync("settings:delete-plugin-setting", { pluginName, settingName });
            };

            service.flushSettingsCache = function () {
                backendCommunicator.fireEvent("settings:flush-settings-cache");
            };

            service.showOverlayInfoModal = function (instanceName) {
                utilityService.showOverlayInfoModal(instanceName);
            };

            return service;
        });
}());