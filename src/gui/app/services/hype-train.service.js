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

          function updateHypeTrainState({ level, progressPercentage, endsAt, isGoldenKappaTrain }) {
              service.currentLevel = level;
              service.currentProgressPercentage = progressPercentage;
              service.endsAt = endsAt;
              service.hypeTrainActive = true;
              service.hypeTrainEnded = false;
              service.isGoldenKappaTrain = isGoldenKappaTrain;
          }

          backendCommunicator.on("hype-train:start", updateHypeTrainState);
          backendCommunicator.on("hype-train:progress", updateHypeTrainState);
          backendCommunicator.on("hype-train:end", () => {
              service.hypeTrainEnded = true;

              $timeout(() => {
                  service.hypeTrainActive = false;
                  service.hypeTrainEnded = false;
                  service.isGoldenKappaTrain = false;
              }, 5000);
          });

        return service;
    });
}());