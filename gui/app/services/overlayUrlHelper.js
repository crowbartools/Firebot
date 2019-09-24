"use strict";

(function() {

    const dataAccess = require("../../backend/common/data-access.js");

    angular
        .module("firebotApp")
        .factory("overlayUrlHelper", function(settingsService) {
            let service = {};

            service.getOverlayPath = function(instanceName) {
                let overlayPath = dataAccess.getPathInUserData("overlay.html");

                let port = settingsService.getWebServerPort();

                let params = {};
                if (port !== 7472 && !isNaN(port)) {
                    params["port"] = settingsService.getWebServerPort();
                }

                if (instanceName != null && instanceName !== "") {
                    params["instance"] = encodeURIComponent(instanceName);
                }

                let paramCount = 0;
                Object.entries(params).forEach(p => {
                    let key = p[0],
                        value = p[1];

                    let prefix = paramCount === 0 ? "?" : "&";

                    overlayPath += `${prefix}${key}=${value}`;

                    paramCount++;
                });

                return overlayPath;
            };

            return service;
        });
}());
