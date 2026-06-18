"use strict";
(function() {
    angular
        .module("firebotApp")
        .factory("timerService", function(backendCommunicator, utilityService, objectCopyHelper, ngToast) {
            const service = {};

            service.timers = [];

            function updateTimer(timer) {
                const index = service.timers.findIndex(t => t.id === timer.id);
                if (index > -1) {
                    service.timers[index] = timer;
                } else {
                    service.timers.push(timer);
                }
            }

            backendCommunicator.on("timerUpdate", (timer) => {
                updateTimer(timer);
            });

            backendCommunicator.onAsync("timers:all-timers-updated", async (timers) => {
                service.timers = timers;
            });

            service.getTimers = () => service.timers;

            service.saveTimer = async (timer) => {
                const savedTimer = await backendCommunicator.fireEventAsync("timers:save-timer", timer);
                if (savedTimer) {
                    updateTimer(savedTimer);
                    return true;
                }
                return false;
            };

            service.saveAllTimers = function(timers) {
                service.timers = timers;
                backendCommunicator.send("timers:save-all-timers", timers);
            };

            service.toggleTimerActiveState = function(timer) {
                if (timer == null) {
                    return;
                }

                timer.active = !timer.active;
                service.saveTimer(timer);
            };

            service.timerNameExists = (name) => {
                return service.timers.some(t => t.name === name);
            };

            service.duplicateTimer = async (timerId) => {
                const timer = service.timers.find(t => t.id === timerId);
                if (timer == null) {
                    return;
                }
                const copiedTimer = objectCopyHelper.copyObject("timer", timer);
                copiedTimer.id = null;

                while (service.timerNameExists(copiedTimer.name)) {
                    copiedTimer.name += " copy";
                }

                const successful = await service.saveTimer(copiedTimer);
                if (successful) {
                    ngToast.create({
                        className: 'success',
                        content: 'Successfully duplicated a timer!'
                    });
                } else {
                    ngToast.create("Unable to duplicate timer.");
                }
            };

            // Deletes a timer.
            service.deleteTimer = function(timer) {
                if (timer == null) {
                    return;
                }

                service.timers = service.timers.filter(t => t.id !== timer.id);

                backendCommunicator.send("timers:delete-timer", timer.id);
            };

            service.showAddEditTimerModal = function(timer) {
                return new Promise((resolve) => {
                    utilityService.showModal({
                        component: "addOrEditTimerModal",
                        breadcrumbName: "Edit Timer",
                        size: "md",
                        resolveObj: {
                            timer: () => timer
                        },
                        closeCallback: (response) => {
                            resolve(response.timer);
                        }
                    });
                });
            };

            backendCommunicator.send("timers:ui-service-ready");

            return service;
        });
}());
