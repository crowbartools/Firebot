"use strict";

(function() {

    const sanitizeFileName = require("sanitize-filename");
    const path = require("path");

    angular
        .module("firebotApp")
        .factory("countersService", function($q, backendCommunicator, profileManager) {
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

            service.counterNameExists = (name) => {
                if (name == null) {
                    return false;
                }
                const sanitizedName = sanitizeFileName(name).toLowerCase();
                return service.counters.some(c => sanitizeFileName(c.name).toLowerCase() === sanitizedName);
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
                    updateCounter(counter);
                }
            };

            service.renameCounter = (counterId, newName) => {
                if (counterId == null || newName == null) {
                    return;
                }

                const counter = service.getCounter(counterId);

                if (counter) {
                    counter.name = newName;
                    service.saveCounter(counter);
                }
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
                if (counters != null) {
                    service.counters = counters;
                }
            });

            return service;
        });
}());
