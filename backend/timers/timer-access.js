"use strict";
const EventEmitter = require("events");
const logger = require("../logwrapper");
const profileManager = require("../common/profile-manager");
const frontendCommunicator = require("../common/frontend-communicator");

const getTimersDb = () => profileManager.getJsonDbInProfile("timers");

/**@extends {NodeJS.EventEmitter} */
class TimerAccess extends EventEmitter {

    constructor() {
        super();
        this._timers = {};
    }

    getTimers() {
        return Object.values(this._timers);
    }

    getTimer(timerId) {
        return this.getTimers().find(t => t.timerId === timerId);
    }

    loadTimers() {
        logger.debug(`Attempting to load timers...`);

        const timersDb = getTimersDb();

        try {
            const timerData = timersDb.getData("/");

            if (timerData) {
                this._timers = timerData;
            }

            logger.debug(`Loaded Timers.`);

        } catch (err) {
            logger.warn(`There was an error reading timers file.`, err);
        }
    }

    saveTimer(timer, emitUpdateEventToFrontEnd = true) {
        if (timer == null) return;

        this._timers[timer.id] = timer;

        try {
            const timerDb = getTimersDb();

            timerDb.push("/" + timer.id, timer);

            logger.debug(`Saved timer ${timer.id} to file.`);

            if (emitUpdateEventToFrontEnd) {
                frontendCommunicator.send("timerUpdate", timer);
            }

            this.emit("timer-save", timer);
        } catch (err) {
            logger.warn(`There was an error saving an timer.`, err);
        }
    }

    deleteTimer(timerId) {
        if (timerId == null) return;

        delete this._timers[timerId];

        try {
            const timerDb = getTimersDb();

            timerDb.delete("/" + timerId);

            logger.debug(`Deleted timer: ${timerId}`);

            this.emit("timer-delete", timerId);
        } catch (err) {
            logger.warn(`There was an error deleting a timer.`, err);
        }
    }
}

const timerAccess = new TimerAccess();

frontendCommunicator.onAsync("getTimers", async () => timerAccess.getTimers());

frontendCommunicator.on("saveTimer", (timer) => {
    timerAccess.saveTimer(timer, false);
});

frontendCommunicator.on("deleteTimer", (timerId) => {
    timerAccess.deleteTimer(timerId);
});

module.exports = timerAccess;
