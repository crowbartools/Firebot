"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("iconService", function(backendCommunicator) {
            let service = {};

            service.icons = [];

            service.loadFontAwesomeIcons = async () => {
                const icons = backendCommunicator.fireEventSync("all-font-awesome-icons");

                if (icons) {
                    service.icons = icons;
                }
            };

            return service;
        });
}());
