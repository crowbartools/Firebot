"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("countersService", function(backendCommunicator, utilityService, objectCopyHelper, ngToast) {
            const service = {};

            service.counters = [];

            const updateCounter = (counter) => {
                const index = service.counters.findIndex(c => c.id === counter.id);
                if (index > -1) {
                    service.counters[index] = counter;
                } else {
                    service.counters.push(counter);
                }
            };

            service.getCounter = (counterId) => {
                return service.counters.find(c => c.id === counterId);
            };

            service.deleteCounter = (counterId) => {
                service.counters = service.counters.filter(c => c.id !== counterId);
                backendCommunicator.fireEvent("counters:delete-counter", counterId);
            };

            service.saveCounter = async (counter) => {
                if (counter == null) {
                    return;
                }

                const savedCounter = await backendCommunicator.fireEventAsync("counters:save-counter", counter);
                if (savedCounter) {
                    updateCounter(savedCounter);
                    return true;
                }

                return false;
            };

            service.saveAllCounters = (counters) => {
                if (counters) {
                    service.counters = counters;
                }

                backendCommunicator.send("counters:save-all-counters", service.counters);
            };

            service.counterNameExists = (name) => {
                return service.counters.some(c => c.name === name);
            };

            service.duplicateCounter = async (counterId) => {
                const counter = service.counters.find(c => c.id === counterId);
                if (counter == null) {
                    return;
                }
                const copiedCounter = objectCopyHelper.copyObject("counter", counter);
                copiedCounter.id = null;

                while (service.counterNameExists(copiedCounter.name)) {
                    copiedCounter.name += " copy";
                }

                const successful = await service.saveCounter(copiedCounter);
                if (successful) {
                    ngToast.create({
                        className: 'success',
                        content: 'Successfully duplicated a counter!'
                    });
                } else {
                    ngToast.create("Unable to duplicate counter.");
                }
            };

            service.getTxtFilePath = async (counterName) => {
                if (counterName == null) {
                    return "";
                }

                return await backendCommunicator.fireEventAsync("counters:get-counter-file-path", counterName);
            };

            backendCommunicator.on("counters:counter-updated", (counter) => {
                updateCounter(counter);
            });

            backendCommunicator.on("counters:all-counters-updated", (counters) => {
                if (counters != null) {
                    service.counters = counters;
                }
            });

            service.showAddEditCounterModal = (counter) => {
                utilityService.showModal({
                    component: "AddOrEditCounterModal",
                    size: "md",
                    resolveObj: {
                        counter: () => counter
                    }
                });
            };

            backendCommunicator.send("counters:ui-service-ready");

            return service;
        });
}());