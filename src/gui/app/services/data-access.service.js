"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("dataAccess", (backendCommunicator) => {
            const service = {};

            service.getPathInUserData = path =>
                backendCommunicator.fireEventSync("data-access:get-path-in-user-data", path);

            return service;
        });
}());