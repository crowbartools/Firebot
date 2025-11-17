"use strict";

import angular from "angular";
import type { BackendCommunicator, PlatformService } from "../../../types";

(function() {
    angular
        .module("firebotApp")
        .factory("platformService", function(backendCommunicator: BackendCommunicator) {
            const service = {} as PlatformService;

            service.loadPlatform = () => {
                backendCommunicator.fireEventAsync<NodeJS.Platform>("getPlatform").then((platform) => {
                    service.platform = platform;
                    service.isMacOs = platform === "darwin";
                    service.isWindows = platform === "win32";
                    service.isLinux = platform === "linux";
                }).catch((err) => {
                    console.error("Error getting platform:", err);
                });
            };

            return service;
        });
}());
