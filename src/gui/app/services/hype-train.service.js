"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("hypeTrainService", function($timeout, backendCommunicator) {
            const service = {};

            service.hypeTrainActive = false;
            service.hypeTrainEnded = false;
            service.currentLevel = 0;
            service.currentProgressPercentage = 0;
            service.endsAt = new Date().toJSON();
            service.isGoldenKappaTrain = false;
            service.isTreasureTrain = false;
            service.isSharedTrain = false;

            function updateHypeTrainState({ level, progressPercentage, endsAt, isGoldenKappaTrain, isTreasureTrain, isSharedTrain }) {
                service.currentLevel = level;
                service.currentProgressPercentage = progressPercentage;
                service.endsAt = endsAt;
                service.hypeTrainActive = true;
                service.hypeTrainEnded = false;
                service.isGoldenKappaTrain = isGoldenKappaTrain;
                service.isTreasureTrain = isTreasureTrain;
                service.isSharedTrain = isSharedTrain;
            }

            backendCommunicator.on("hype-train:start", updateHypeTrainState);
            backendCommunicator.on("hype-train:progress", updateHypeTrainState);
            backendCommunicator.on("hype-train:end", () => {
                service.hypeTrainEnded = true;

                $timeout(() => {
                    service.hypeTrainActive = false;
                    service.hypeTrainEnded = false;
                    service.isGoldenKappaTrain = false;
                    service.isTreasureTrain = false;
                    service.isSharedTrain = false;
                }, 5000);
            });

            return service;
        });
}());