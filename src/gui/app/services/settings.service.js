"use strict";
(function () {
    //This handles settings access for frontend

    angular
        .module("firebotApp")
        .factory("settingsService", function (utilityService, backendCommunicator) {
            const service = {};

            let settingsCache = {};

            backendCommunicator.on("settings:setting-updated", ({ settingName, data }) => {
                if (settingName == null || settingName === "") {
                    return;
                }

                settingsCache[settingName] = data;
            });

            backendCommunicator.on("settings:setting-deleted", (settingName) => {
                delete settingsCache[settingName];
            });

            backendCommunicator.on("settings:settings-cache-flushed", () => {
                settingsCache = {};
            });

            service.getSetting = function (settingName, forceCacheUpdate = false) {
                if (settingsCache[settingName] == null || forceCacheUpdate === true) {
                    settingsCache[settingName] = backendCommunicator.fireEventSync("settings:get-setting", settingName);
                }

                return settingsCache[settingName];
            };

            service.saveSetting = function (settingName, data) {
                backendCommunicator.send("settings:save-setting", {
                    settingName,
                    data
                });
            };

            service.deleteSetting = function (settingName) {
                backendCommunicator.fireEventAsync("settings:delete-setting", settingName);
            };

            service.flushSettingsCache = function () {
                backendCommunicator.send("settings:flush-settings-cache");
            };

            service.showOverlayInfoModal = function (instanceName) {
                utilityService.showOverlayInfoModal(instanceName);
            };

            return service;
        });
}());