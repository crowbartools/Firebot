"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("profileManager", (
            backendCommunicator
        ) => {
            const service = {};

            // Create new profile
            service.createNewProfile = (profileId) => {
                backendCommunicator.send("profiles:create-profile", profileId);
            };

            service.renameProfile = (newProfileId) => {
                backendCommunicator.send("profiles:rename-profile", newProfileId);
            };

            // delete profile
            service.deleteProfile = () => {
                backendCommunicator.send("profiles:delete-profile");
            };

            // switch profile
            service.switchProfiles = (profileId) => {
                backendCommunicator.send("profiles:switch-profile", profileId);
            };

            service.profiles = [];

            service.getActiveProfiles = () =>
                backendCommunicator.fireEventSync("profiles:get-active-profiles");

            service.getLoggedInProfile = () =>
                backendCommunicator.fireEventSync("profiles:get-logged-in-profile");

            service.getPathInProfile = path =>
                backendCommunicator.fireEventSync("profiles:get-path-in-profile", path);

            service.getAccountInfo = (profileId, accountType = "streamer") =>
                backendCommunicator.fireEventSync("profiles:get-account-info", { profileId, accountType });

            backendCommunicator.on("profiles:updated-profiles", (profiles) => {
                service.profiles = profiles;
            });

            backendCommunicator.send("profiles:ui-service-ready");

            return service;
        });
}());