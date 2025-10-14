"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("iconsService", function(backendCommunicator) {
            const service = {};

            /** @type {import("../../../types/icons").FontAwesomeIcon[]} */
            service.icons = [];

            service.loadFontAwesomeIcons = () => {
                const icons = backendCommunicator.fireEventSync("all-font-awesome-icons");

                if (icons) {
                    service.icons = icons;
                }
            };

            return service;
        });
}());
