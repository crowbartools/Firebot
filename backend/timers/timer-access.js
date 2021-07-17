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

    async saveTimer(timer) {
        if (timer == null) return;

        if (timer.id != null) {
            this._timers[timer.id] = timer;
        } else {
            const uuidv1 = require("uuid/v1");
            timer.id = uuidv1();
            this._timers[timer.id] = timer;
        }
    
        try {
            const timersDb = getTimersDb();
    
            timersDb.push("/" + timer.id, timer);
    
            logger.debug(`Saved timer ${timer.id} to file.`);

            this.emit("timer-save", timer);

            return timer;
        } catch (err) {
            logger.warn(`There was an error saving a timer.`, err);
            return null;
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

frontendCommunicator.onAsync("saveTimer", (timer) => timerAccess.saveTimer(timer));

frontendCommunicator.on("deleteTimer", (timerId) => {
    timerAccess.deleteTimer(timerId);
});

module.exports = timerAccess;
