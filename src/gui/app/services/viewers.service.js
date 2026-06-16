"use strict";

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

            service.viewerListVersion = 0;
            const markViewersChanged = () => {
                service.viewerListVersion++;
            };

            service.refreshViewers = markViewersChanged;

            service.getViewersPage = async ({ page, pageSize, sortField, sortReversed, search }) => {
                const result = await backendCommunicator.fireEventAsync("viewer-database:get-viewers-page", {
                    page,
                    pageSize,
                    sortField,
                    sortReversed,
                    search
                });
                return {
                    items: result.viewers,
                    total: result.total,
                    totalUnfiltered: result.totalUnfiltered
                };
            };

            service.updateViewer = async (userId) => {
                await backendCommunicator.fireEventAsync("get-firebot-viewer-data", userId);
                markViewersChanged();
            };

            service.updateBannedStatus = (username, shouldBeBanned) => {
                backendCommunicator.fireEvent("update-user-banned-status", { username, shouldBeBanned });
            };

            backendCommunicator.on("viewer-database:viewer-created", markViewersChanged);
            backendCommunicator.on("viewer-database:viewer-updated", markViewersChanged);
            backendCommunicator.on("viewer-database:viewer-deleted", markViewersChanged);
            backendCommunicator.on("viewer-database:viewers-updated", markViewersChanged);

            // Did user see warning alert about connecting to chat first?
            service.sawWarningAlert = true;
            return service;
        });
}());