"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("adBreakService", function(backendCommunicator) {
            const service = {};

            service.showAdBreakTimer = false;
            service.adRunning = false;
            service.nextAdBreak = new Date().toJSON();
            service.endsAt = new Date().toJSON();
            service.adDuration = 0;
            service.friendlyDuration = "0s";

            service.updateDuration = () => {
                if (service.adDuration < 60) {
                    service.friendlyDuration = `${service.adDuration}s`;
                    return;
                }

                const mins = Math.floor(service.adDuration / 60);
                const remainingSecs = service.adDuration % 60;

                service.friendlyDuration = `${mins}m${remainingSecs > 0 ? ` ${remainingSecs}s` : ""}`;
            };

            backendCommunicator.on("ad-manager:next-ad", ({ nextAdBreak, duration }) => {
                service.showAdBreakTimer = true;
                service.adRunning = false;
                service.nextAdBreak = nextAdBreak;
                service.adDuration = duration;
                service.updateDuration();
            });

            backendCommunicator.on("ad-manager:ad-running", ({ duration, endsAt }) => {
                service.showAdBreakTimer = true;
                service.adRunning = true;
                service.adDuration = duration;
                service.endsAt = endsAt;
                service.updateDuration();
            });

            backendCommunicator.on("ad-manager:hide-ad-break-timer", () => {
                service.showAdBreakTimer = false;
            });

            return service;
        });
}());