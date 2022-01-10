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

            service.loadCounters = () => {
                $q.when(backendCommunicator.fireEventAsync("get-counters"))
                    .then(counters => {
                        if (counters) {
                            service.counters = counters;
                        }
                    });
            };

            service.createCounter = (name) => {
                $q.when(backendCommunicator.fireEventAsync("create-counter", name))
                    .then(newCounter => {
                        if (newCounter) {
                            service.counters.push(newCounter);
                        }
                    });
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
                backendCommunicator.fireEvent("delete-counter", counterId);
            };

            service.saveCounter = (counter) => {
                if (counter == null) {
                    return;
                }

                const index = service.counters.findIndex(c => c.id === counter.id);
                service.counters[index] = counter;
                backendCommunicator.fireEvent("save-counter", counter);
            };

            service.renameCounter = (counterId, newName) => {
                if (counterId == null || newName == null) {
                    return;
                }

                const index = service.counters.findIndex(c => c.id === counterId);
                if (index >= 0) {
                    service.counters[index].name = newName;
                    backendCommunicator.fireEvent("rename-counter", {
                        counterId,
                        newName
                    });
                }
            };

            service.createTxtFileForCounter = (counterId) => {
                backendCommunicator.fireEvent("create-counter-txt-file", counterId);
            };

            service.deleteTxtFileForCounter = (counterId) => {
                backendCommunicator.fireEvent("delete-counter-txt-file", counterId);
            };

            service.getTxtFilePath = (counterName) => {
                if (counterName == null) {
                    return "";
                }

                const sanitizedCounterName = sanitizeFileName(counterName);
                return path.join(COUNTERS_FOLDER, `${sanitizedCounterName}.txt`);
            };

            backendCommunicator.on("counter-update", data => {
                let { counterId, counterValue } = data;

                let counter = service.counters.find(c => c.id === counterId);
                if (counter) {
                    counter.value = counterValue;
                }
            });

            backendCommunicator.on("all-counters", counters => {
                if (counters) {
                    service.counters = counters;
                }
            });

            return service;
        });
}());
