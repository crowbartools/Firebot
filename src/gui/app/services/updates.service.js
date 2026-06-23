'use strict';

(function(angular) {
    const { marked } = require("marked");
    const { sanitize } = require("dompurify");

    angular
        .module('firebotApp')
        .factory('updatesService', function ($sce, modalFactory, backendCommunicator) {
            const service = {};

            service.updateData = null;

            service.installUpdate = () => {
                backendCommunicator.send("updates:install-update");
            };

            service.downloadAndInstallUpdate = () => {
                backendCommunicator.send("updates:download-and-install-update");
            };

            backendCommunicator.on("updates:update-data", (updateData) => {
                service.updateData = updateData;

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