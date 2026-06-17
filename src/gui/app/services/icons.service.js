"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("iconsService", function(backendCommunicator) {
            const service = {};

            /** @type {import("../../../types").FontAwesomeIcon[]} */
            service.icons = [];

            service.loadFontAwesomeIcons = async () => {
                const icons = await backendCommunicator.fireEventAsync("all-font-awesome-icons");

                if (icons) {
                    service.icons = icons;
                }
            };

            return service;
        });
}());
