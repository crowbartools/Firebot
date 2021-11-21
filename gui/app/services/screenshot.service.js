"use strict";
(function() {

    const { desktopCapturer } = require("electron");

    angular
        .module("firebotApp")
        .factory("quotesService", function(logger, backendCommunicator) {
            let service = {};

            backendCommunicator.onAsync("takeScreenshot", async (data) => {

                try {
                    const sources = await desktopCapturer.getSources({ types: ['screen'] });

                    const foundSource = sources.find(s => s.display_id === data.displayId);

                    if (foundSource) {
                        return foundSource.thumbnail.toDataURL();
                    }
                    return null;

                } catch (error) {
                    logger.error("Failed to take screenshot", error);
                    return null;
                }
            });

            return service;
        });
}());
