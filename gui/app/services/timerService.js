"use strict";
(function() {
    //This manages command data
    const profileManager = require("../../lib/common/profile-manager.js");
    const moment = require("moment");

    angular
        .module("firebotApp")
        .factory("timerService", function(logger, connectionService) {
            let service = {};

            let getTimerDB = () => profileManager.getJsonDbInProfile("timers");

            // in memory timer storage
            let timersCache = [];

            // Refresh timer cache
            service.refreshTimers = function() {
                let timerDb = getTimerDB();

                let timerData;
                try {
                    timerData = timerDb.getData("/");
                } catch (err) {
                    logger.warning("error getting timer data", err);
                    return;
                }

                if (timerData != null) {
                    timersCache = Object.values(timerData);
                }

                // Refresh the timer cache.
                ipcRenderer.send("refreshTimerCache");
            };

            service.getTimers = () => timersCache;

            service.saveTimer = function(timer) {
                logger.debug("saving timer: " + timer.name);
                if (timer.id == null || timer.id === "") {
                    // generate id for new command
                    const uuidv1 = require("uuid/v1");
                    timer.id = uuidv1();

                    timer.createdBy = connectionService.accounts.streamer.username;
                    timer.createdAt = moment().format();
                }

                let cleanedTimer = JSON.parse(angular.toJson(timer));

                let timerDb = getTimerDB();
                try {
                    timerDb.push("/" + cleanedTimer.id, cleanedTimer);
                } catch (err) {} //eslint-disable-line no-empty
            };

            // Deletes a command.
            service.deleteTimer = function(timer) {
                if (timer == null) return;

                let timerDb = getTimerDB();
                try {
                    timerDb.delete("/" + timer.id);
                } catch (err) {
                    logger.warn("error when deleting timer", err);
                } //eslint-disable-line no-empty
            };

            return service;
        });
}());
