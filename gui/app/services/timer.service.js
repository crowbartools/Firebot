"use strict";
(function() {

    const moment = require("moment");
    const uuid = require("uuid/v4");

    angular
        .module("firebotApp")
        .factory("timerService", function(logger, connectionService, backendCommunicator, $q, utilityService) {
            let service = {};

            service.timers = [];

            function updateTimer(timer) {
                const index = service.timers.findIndex(t => t.id === timer.id);
                if (index > -1) {
                    service.timers[index] = timer;
                } else {
                    service.timers.push(timer);
                }
            }

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

            service.saveTimer = function(timer) {
                return $q.when(backendCommunicator.fireEventAsync("saveTimer", timer))
                .then(savedTimer => {
                    if (savedTimer) {
                        updateTimer(savedTimer);
                        return true;
                    }
                    return false;
                });
            };

            // Deletes a timer.
            service.deleteTimer = function(timer) {
                if (timer == null) return;

                service.timers = service.timers.filter(t => t.id !== timer.id);

                backendCommunicator.fireEvent("deleteTimer", timer.id);
            };

            service.showAddEditTimerModal = function(timer) {
                return new Promise(resolve => {
                    utilityService.showModal({
                        component: "addOrEditTimerModal",
                        size: "md",
                        resolveObj: {
                            timer: () => timer
                        },
                        closeCallback: response => {
                            resolve(response.timer);
                        }
                    });
                });
            };

            return service;
        });
}());
