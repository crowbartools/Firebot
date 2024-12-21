"use strict";

(function() {

    const dataAccess = require("../../backend/common/data-access.js");

    angular
        .module("firebotApp")
        .factory("overlayUrlHelper", function(settingsService) {
            const service = {};

            service.getOverlayPath = function(instanceName) {
                let overlayPath = dataAccess.getPathInUserData("overlay.html");

                const port = settingsService.getSetting("WebServerPort");

                const params = {};
                if (port !== 7472 && !isNaN(port)) {
                    params["port"] = settingsService.getSetting("WebServerPort");
                }

                if (instanceName != null && instanceName !== "") {
                    params["instance"] = encodeURIComponent(instanceName);
                }

                let paramCount = 0;
                Object.entries(params).forEach((p) => {
                    const key = p[0],
                        value = p[1];

                    const prefix = paramCount === 0 ? "?" : "&";

                    overlayPath += `${prefix}${key}=${value}`;

                    paramCount++;
                });

                return `file:///${overlayPath}`;
            };

            return service;
        });
}());
