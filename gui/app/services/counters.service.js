"use strict";

(function() {

    const sanitizeFileName = require("sanitize-filename");
    const path = require("path");

    angular
        .module("firebotApp")
        .factory("countersService", function($q, backendCommunicator, profileManager, utilityService, objectCopyHelper, ngToast) {
            let service = {};

            service.counters = [];

            const COUNTERS_FOLDER = profileManager.getPathInProfile("/counters/");

            const updateCounter = (counter) => {
                const index = service.counters.findIndex(c => c.id === counter.id);
                if (index > -1) {
                    service.counters[index] = counter;
                } else {
                    service.counters.push(counter);
                }
            };

            service.loadCounters = () => {
                $q.when(backendCommunicator.fireEventAsync("getCounters"))
                    .then(counters => {
                        if (counters) {
                            service.counters = counters;
                        }
                    });
            };

            service.getCounter = (counterId) => {
                return service.counters.find(c => c.id === counterId);
            };

            service.deleteCounter = (counterId) => {
                service.counters = service.counters.filter(c => c.id !== counterId);
                backendCommunicator.fireEvent("deleteCounter", counterId);
            };

            service.saveCounter = async (counter) => {
                if (counter == null) {
                    return;
                }

                const savedCounter = await backendCommunicator.fireEventAsync("saveCounter", counter);
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

                backendCommunicator.fireEvent("saveAllCounters", service.counters);
            };

            service.counterNameExists = (name) => {
                return service.counters.some(c => c.name === name);
            };

            service.duplicateCounter = (counterId) => {
                const counter = service.counters.find(c => c.id === counterId);
                if (counter == null) {
                    return;
                }
                const copiedCounter = objectCopyHelper.copyObject("counter", counter);
                copiedCounter.id = null;

                while (service.counterNameExists(copiedCounter.name)) {
                    copiedCounter.name += " copy";
                }

                service.saveCounter(copiedCounter).then(successful => {
                    if (successful) {
                        ngToast.create({
                            className: 'success',
                            content: 'Successfully duplicated a counter!'
                        });
                    } else {
                        ngToast.create("Unable to duplicate counter.");
                    }
                });
            };

            service.getTxtFilePath = (counterName) => {
                if (counterName == null) {
                    return "";
                }

                const sanitizedCounterName = sanitizeFileName(counterName);
                return path.join(COUNTERS_FOLDER, `${sanitizedCounterName}.txt`);
            };

            backendCommunicator.on("counter-update", counter => {
                updateCounter(counter);
            });

            backendCommunicator.on("all-counters", counters => {
                if (counters.length) {
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

            return service;
        });
}());
