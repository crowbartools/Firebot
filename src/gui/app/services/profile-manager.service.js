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

            service.getPathInProfile = path =>
                backendCommunicator.fireEventSync("profiles:get-path-in-profile", path);

            backendCommunicator.on("profiles:updated-profiles", (profiles) => {
                service.profiles = profiles;
            });

            backendCommunicator.send("profiles:ui-service-ready");

            return service;
        });
}());