"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("fontManager", function (backendCommunicator) {
            const service = {};

            service.systemFonts = [];

            service.getFontFolderPath = async () => {
                return await backendCommunicator.fireEventAsync("fonts:get-font-folder-path");
            };

            service.getFontCssPath = async () => {
                return await backendCommunicator.fireEventAsync("fonts:get-generated-css-path");
            };

            service.getInstalledFonts = async () => {
                return await backendCommunicator.fireEventAsync("fonts:get-installed-fonts");
            };

            service.getFont = async (name) => {
                return await backendCommunicator.fireEventAsync("fonts:get-font", name);
            };

            service.installFont = async (path) => {
                return await backendCommunicator.fireEventAsync("fonts:install-font", path);
            };

            service.removeFont = async (name) => {
                return await backendCommunicator.fireEventAsync("fonts:remove-font", name);
            };

            service.getSystemFonts = async () => {
                // Only return the family names, filter duplicates and falsy values
                return (await window.queryLocalFonts())?.map(f => f.family).filter((v, i, a) => !!v && a.indexOf(v) === i) ?? [];
            };

            return service;
        });
}());