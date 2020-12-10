"use strict";
(function() {

    const moment = require("moment");
    const uuid = require("uuid/v4");

    angular
        .module("firebotApp")
        .factory("timerService", function(logger, connectionService, backendCommunicator, $q) {
            let service = {};

            service.timers = [];

            service.loadTimers = function() {
                $q.when(backendCommunicator.fireEventAsync("getTimers"))
                    .then(timers => {
                        if (timers) {
                            service.timers = timers;
                        }
                    });
            };

            backendCommunicator.on("timerUpdate", timer => {
                if (timer == null || timer.id == null) return;
                service.saveTimer(timer, false);
            });

            service.getTimers = () => service.timers;

            service.saveTimer = function(timer, notifyBackend = true) {
                logger.debug("saving timer: " + timer.name);
                if (timer.id == null || timer.id === "") {
                    timer.id = uuid();
                    timer.createdBy = connectionService.accounts.streamer.username;
                    timer.createdAt = moment().format();
                }

                const cleanedTimer = JSON.parse(angular.toJson(timer));

                if (notifyBackend) {
                    backendCommunicator.fireEvent("saveTimer", cleanedTimer);
                }

                const currentIndex = service.timers.findIndex(t => t.id === cleanedTimer.id);
                if (currentIndex < 0) {
                    service.timers.push(cleanedTimer);
                } else {
                    service.timers[currentIndex] = cleanedTimer;
                }
            };

            // Deletes a timer.
            service.deleteTimer = function(timer) {
                if (timer == null) return;

                service.timers = service.timers.filter(t => t.id !== timer.id);

                backendCommunicator.fireEvent("deleteTimer", timer.id);
            };

            return service;
        });
}());
