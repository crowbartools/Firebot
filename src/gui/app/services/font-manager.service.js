"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("fontManager", function (backendCommunicator) {
            const service = {};

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

            return service;
        });
}());