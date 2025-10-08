"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("fontManager", function (backendCommunicator, $q) {
            const service = {};

            service.systemFonts = [];

            service.getFontFolderPath = () => {
                return backendCommunicator.fireEventSync("fonts:get-font-folder-path");
            };

            service.getFontCssPath = () => {
                return backendCommunicator.fireEventSync("fonts:get-generated-css-path");
            };

            service.getInstalledFonts = () => {
                return backendCommunicator.fireEventSync("fonts:get-installed-fonts");
            };

            service.getFont = (name) => {
                return backendCommunicator.fireEventSync("fonts:get-font", name);
            };

            service.installFont = async (path) => {
                return await backendCommunicator.fireEventAsync("fonts:install-font", path);
            };

            service.removeFont = async (name) => {
                return await backendCommunicator.fireEventAsync("fonts:remove-font", name);
            };

            service.getSystemFonts = () => {
                return $q.when(window.queryLocalFonts()).then((fonts) => {
                    // Only return the family names, filter duplicates and falsy values
                    return fonts?.map(f => f.family).filter((v, i, a) => !!v && a.indexOf(v) === i) ?? [];
                });
            };

            return service;
        });
}());