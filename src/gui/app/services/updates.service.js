'use strict';

(function(angular) {
    const { marked } = require("marked");
    const { sanitize } = require("dompurify");

    angular
        .module('firebotApp')
        .factory('updatesService', function (
            $sce,
            settingsService,
            modalFactory,
            backendCommunicator
        ) {
            const service = {};

            service.updateData = null;

            service.installUpdate = () => {
                backendCommunicator.send("updates:install-update");
            };

            service.downloadAndInstallUpdate = () => {
                backendCommunicator.send("updates:download-and-install-update");
            };

            backendCommunicator.on("updates:update-data", (data) => {
                service.updateData = data.updateData;

                if (data.justUpdated === true && data.pendingUpdate !== true) {
                    modalFactory.showUpdatedModal();
                    settingsService.saveSetting("JustUpdated", false);
                }

                if (service.updateData?.releaseNotes) {
                    service.updateData.releaseNotes = $sce.trustAsHtml(sanitize(marked(service.updateData.releaseNotes)));
                }
            });

            backendCommunicator.on("updates:show-download-modal", () => {
                modalFactory.showDownloadModal();
            });

            backendCommunicator.send("updates:ui-service-ready");

            return service;
        });
}(window.angular));