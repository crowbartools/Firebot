"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("iconsService", function(backendCommunicator) {
            const service = {};

            /** @type {import("../../../types").FontAwesomeIcon[]} */
            service.icons = [];

            backendCommunicator.on("icons:icons-updated", (icons) => {
                service.icons = icons;
            });

            backendCommunicator.send("icons:ui-service-ready");

            return service;
        });
}());