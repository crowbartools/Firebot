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

            service.flushSettingsCache = function () {
                backendCommunicator.fireEvent("settings:flush-settings-cache");
            };

            service.showOverlayInfoModal = function (instanceName) {
                utilityService.showOverlayInfoModal(instanceName);
            };

            return service;
        });
}());