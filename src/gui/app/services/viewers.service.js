"use strict";
(function() {
    //This handles viewer lists.

    angular
        .module("firebotApp")
        .factory("viewersService", function(settingsService, backendCommunicator, $q) {
            const service = {};

            // Check to see if the DB is turned on or not.
            service.isViewerDbOn = function() {
                return settingsService.getSetting("ViewerDB");
            };

            service.viewers = [];
            let waitingForUpdate = false;
            service.updateViewers = function() {
                if (waitingForUpdate) {
                    return Promise.resolve();
                }

                waitingForUpdate = true;
                return $q((resolve) => {
                    backendCommunicator.fireEventAsync("get-all-viewers")
                        .then((viewers) => {
                            resolve(viewers);
                        });
                }).then((viewers) => {
                    service.viewers = viewers;
                    waitingForUpdate = false;
                });
            };

            service.updateViewer = function(userId) {
                return $q((resolve) => {
                    backendCommunicator.fireEventAsync("get-firebot-viewer-data", userId)
                        .then((viewer) => {
                            resolve(viewer);
                        });
                }).then((viewer) => {
                    if (viewer) {
                        const index = service.viewers.findIndex(v => v._id === viewer._id);
                        if (index >= 0) {
                            service.viewers[index] = viewer;
                        }
                    }
                });
            };

            service.updateBannedStatus = (username, shouldBeBanned) => {
                backendCommunicator.fireEvent("update-user-banned-status", { username, shouldBeBanned });
            };

            service.updateModStatus = (username, shouldBeMod) => {
                backendCommunicator.fireEvent("update-user-mod-status", { username, shouldBeMod });
            };

            // Did user see warning alert about connecting to chat first?
            service.sawWarningAlert = true;
            return service;
        });
}());
