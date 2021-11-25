"use strict";
const EventEmitter = require("events");
const logger = require("../logwrapper");
const profileManager = require("../common/profile-manager");
const frontendCommunicator = require("../common/frontend-communicator");

const getTimersDb = () => profileManager.getJsonDbInProfile("timers");

/**
 * @typedef SavedTimer
 * @property {string} id - the id of the timer
 * @property {name} name - the name of the timer
 * @property {object} effects - the saved effects in the list
 * @property {string} effects.id - the effect list root id
 * @property {any[]} effects.list - the array of effects objects
 * @property {boolean} active - the active status of the timer
 * @property {number} interval - the interval of the timer
 * @property {number} requiredChatLines - the amount of chat lines before the timer starts
 * @property {boolean} onlyWhenLive - whether the timer should only run when the stream is live
 */

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
        return this.getTimers().find(t => t.id === timerId);
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
        if (timer == null) {
            return;
        }

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

            this.emit("timerSaved", timer);

            return timer;
        } catch (err) {
            logger.warn(`There was an error saving a timer.`, err);
            return null;
        }
    }

    /**
     *
     * @param {SavedTimer[]} allTimers
     */
    async saveAllTimers(allTimers) {
        /** @type {Record<string,SavedTimer>} */
        const timersObject = allTimers.reduce((acc, current) => {
            acc[current.id] = current;
            return acc;
        }, {});

        this._timers = timersObject;

        try {
            const timersDb = getTimersDb();

            timersDb.push("/", this._timers);

            logger.debug(`Saved all timers to file.`);

        } catch (err) {
            logger.warn(`There was an error saving all timers.`, err);
            return null;
        }
    }

    deleteTimer(timerId) {
        if (timerId == null) {
            return;
        }

        delete this._timers[timerId];

        try {
            const timerDb = getTimersDb();

            timerDb.delete("/" + timerId);

            logger.debug(`Deleted timer: ${timerId}`);

            this.emit("timerDeleted", timerId);
        } catch (err) {
            logger.warn(`There was an error deleting a timer.`, err);
        }
    }

    updateTimerActiveStatus(timerId, active = false) {
        const timer = this._timers[timerId];

        if (timer == null) {
            return;
        }

        timer.active = active;

        this.saveTimer(timer);

        frontendCommunicator.send("timerUpdate", timer);
    }

    triggerUiRefresh() {
        frontendCommunicator.send("all-timers-updated", this.getTimers());
    }
}

const timerAccess = new TimerAccess();

frontendCommunicator.onAsync("getTimers", async () => timerAccess.getTimers());

frontendCommunicator.onAsync("saveTimer", (timer) => timerAccess.saveTimer(timer));

frontendCommunicator.onAsync("saveAllTimers",
    async (/** @type {SavedTimer[]} */ allTimers) => {
        timerAccess.saveAllTimers(allTimers);
    }
);

frontendCommunicator.on("deleteTimer", (timerId) => {
    timerAccess.deleteTimer(timerId);
});

module.exports = timerAccess;
