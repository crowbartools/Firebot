"use strict";

/** @import { FirebotViewer } from "../../../types/viewers" */

(function() {
    //This handles viewer lists.

    angular
        .module("firebotApp")
        .factory("viewersService", function(settingsService, backendCommunicator) {
            const service = {};

            // Check to see if the DB is turned on or not.
            service.isViewerDbOn = () => {
                return settingsService.getSetting("ViewerDB");
            };

            /** @type {FirebotViewer[]} */
            service.viewers = [];
            let waitingForUpdate = false;

            service.updateViewers = async () => {
                if (waitingForUpdate) {
                    return;
                }

                waitingForUpdate = true;

                const viewers = await backendCommunicator.fireEventAsync("viewer-database:get-all-viewers");
                service.viewers = viewers;
                waitingForUpdate = false;
            };

            /** @param {FirebotViewer} viewer */
            const createOrUpdateViewer = (viewer) => {
                const index = service.viewers.findIndex(v => v._id === viewer._id);

                if (index > -1) {
                    service.viewers[index] = viewer;
                } else {
                    service.viewers.push(viewer);
                }
            };

            service.updateViewer = async (userId) => {
                const viewer = await backendCommunicator.fireEventAsync("get-firebot-viewer-data", userId);
                createOrUpdateViewer(viewer);
            };

            service.updateBannedStatus = (username, shouldBeBanned) => {
                backendCommunicator.fireEvent("update-user-banned-status", { username, shouldBeBanned });
            };

            backendCommunicator.on("viewer-database:viewer-created", (viewer) => {
                createOrUpdateViewer(viewer);
            });

            backendCommunicator.on("viewer-database:viewer-updated", (viewer) => {
                createOrUpdateViewer(viewer);
            });

            backendCommunicator.on("viewer-database:viewer-deleted", (userId) => {
                service.viewers = service.viewers.filter(v => v._id !== userId);
            });

            backendCommunicator.on("viewer-database:viewers-updated", () => {
                service.updateViewers();
            });

            // Did user see warning alert about connecting to chat first?
            service.sawWarningAlert = true;
            return service;
        });
}());