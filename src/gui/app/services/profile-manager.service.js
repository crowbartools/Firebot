"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("profileManager", (
            backendCommunicator
        ) => {
            const service = {};

            service.getActiveProfiles = () =>
                backendCommunicator.fireEventSync("profiles:get-active-profiles");

            service.getLoggedInProfile = () =>
                backendCommunicator.fireEventSync("profiles:get-logged-in-profile");

            service.getPathInProfile = path =>
                backendCommunicator.fireEventSync("profiles:get-path-in-profile", path);

            service.getAccountInfo = (profileId, accountType = "streamer") =>
                backendCommunicator.fireEventSync("profiles:get-account-info", { profileId, accountType });

            return service;
        });
}());