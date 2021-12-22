"use strict";

const logger = require("../logwrapper");
const connectionManager = require("../common/connection-manager");
const accountAccess = require("../common/account-access");
const { TriggerType } = require("../common/EffectType");
const effectRunner = require("../common/effect-runner");
const moment = require("moment");
const frontendCommunicator = require("../common/frontend-communicator");
const JsonDbManager = require("../database/json-db-manager");

/**
 * @typedef Timer
 * @prop {string} id - the id of the timer
 * @prop {string} name - the name of the timer
 * @prop {boolean} active - the active status of the timer
 * @prop {number} interval - the interval at which the timer should run
 * @prop {number} requiredChatLines - the minimum number of chat lines since the last interval
 * @prop {boolean} onlyWhenLive - whether the timer should only run when the streamer is live
 * @prop {object} effects - the saved effects in the timer
 * @prop {string} effects.id - the effect list root id
 * @prop {any[]} effects.list - the array of effects objects
 * @prop {string[]} sortTags - the sort tags for the timer
 */

/**
 * @typedef TimerIntervalTracker
 * @prop {string} timerId
 * @prop {boolean} onlyWhenLive
 * @prop {Timer} timer
 * @prop {number} requiredChatLines
 * @prop {boolean} waitingForChatLines
 * @prop {number} chatLinesSinceLastRunCount
 * @prop {string} intervalId
 * @prop {moment.Moment} startedAt
 * */

/**
 * @extends {JsonDbManager<Timer>}
 */
class TimerManager extends JsonDbManager {
    constructor() {
        super("Timer", "timers");

        /** @protected */
        this.timerIntervalCache = {};
    }

    /**
     * @param {Timer} timer
     * @returns {Promise.<Timer>}
     */
    async saveItem(timer) {
        const savedTimer = await super.saveItem(timer);

        if (savedTimer != null) {
            this.updateIntervalForTimer(timer);
            return savedTimer;
        }
    }

    /**
     * @param {string} timerId
     */
    async deleteItem(timerId) {
        await super.deleteItem(timerId);
        this.clearIntervalForTimerId(timerId);
    }

    /**
     * @emits
     * @param {string} timerId
     * @param {boolean} active
     */
    async updateTimerActiveStatus(timerId, active = false) {
        const timer = this.getItem(timerId);

        if (timer != null) {
            timer.active = active;

            const savedTimer = await this.saveItem(timer);
            if (savedTimer != null) {
                frontendCommunicator.send("timerUpdate", timer);
            }
        }
    }

    /**
     * @emits
     * @returns {void}
     */
    triggerUiRefresh() {
        frontendCommunicator.send("all-timers-updated", this.getAllItems());
    }

    /**
     * @param {boolean} onlyClearWhenLiveTimers
     */
    clearIntervals(onlyClearWhenLiveTimers = false) {
        let intervalsToClear;
        if (onlyClearWhenLiveTimers) {
            intervalsToClear = Object.values(this.timerIntervalCache).filter(i => i.onlyWhenLive);
        } else {
            intervalsToClear = Object.values(this.timerIntervalCache);
        }

        intervalsToClear.forEach(i => {
            clearInterval(i.intervalId);
            delete this.timerIntervalCache[i.timerId];
        });
    }

    /**
     *
     * @param {number} timerId
     * @returns {void}
     */
    clearIntervalForTimerId(timerId) {
        const intervalData = this.timerIntervalCache[timerId];
        if (intervalData == null) {
            return;
        }
        clearInterval(intervalData.intervalId);
        delete this.timerIntervalCache[intervalData.timerId];
    }

    /**
     * This is the function we run on every interval of a timer
     * @param {Timer} timer
     * @returns {void}
     */
    runTimer(timer) {
        logger.debug(`Running timer ${timer.name}`);
        // if the passed timer is null, stop
        if (timer == null) {
            return;
        }

        // get the saved interval for this timer id
        const interval = this.timerIntervalCache[timer.id];
        if (interval == null) {
            return;
        }

        // check if we have chat lines requirement
        if (timer.requiredChatLines > 0) {
            // check if enough chat lines have happened
            if (interval.chatLinesSinceLastRunCount < timer.requiredChatLines) {
                // set timer to waiting for chat lines
                logger.debug(`Not enough chat lines have happened since last time the timer "${timer.name}" has ran. Waiting for enough lines.`);
                interval.waitingForChatLines = true;
                clearInterval(interval.intervalId);
                return;
            }

            // we've had enough chat lines, reset the counter
            interval.chatLinesSinceLastRunCount = 0;

            if (interval.waitingForChatLines) {
                const intervalId = setInterval(this.runTimer.bind(this), timer.interval * 1000, timer);
                interval.intervalId = intervalId;
                interval.waitingForChatLines = false;
                logger.debug(`Chat line requirement has been met for timer "${timer.name}". Running effects and restarting interval.`);
            }
        }

        if (timer.effects) {
            const effectsRequest = {
                trigger: {
                    type: TriggerType.TIMER,
                    metadata: {
                        username: accountAccess.getAccounts().streamer.username,
                        timer: timer
                    }
                },
                effects: timer.effects
            };
            effectRunner.processEffects(effectsRequest);
        }
    }

    /**
     *
     * @param {Timer} timer
     * @returns {TimerIntervalTracker}
     */
    buildIntervalForTimer(timer) {
        /**
         * Create the interval.
         * The first argument "runTimer" is the function defined above.
         * The second argument is how often the user defined this timer to run (mins converted to milliseconds)
         * The third argument "timer" is the timer object getting passed as an argument to the "runTimer" fuction
         *
         * the setInterval function returns an id that we use to clear the interval when needed
         */
        const intervalId = setInterval(this.runTimer.bind(this), timer.interval * 1000, timer);

        // Create our object that will track the interval and its progress
        const intervalTracker = {
            timerId: timer.id,
            onlyWhenLive: timer.onlyWhenLive,
            timer: timer,
            requiredChatLines: timer.requiredChatLines,
            waitingForChatLines: false,
            chatLinesSinceLastRunCount: 0,
            intervalId: intervalId,
            startedAt: moment()
        };

        return intervalTracker;
    }

    /**
     * @param {Timer} timer
     * @returns {void}
     */
    updateIntervalForTimer(timer) {
        if (timer == null) {
            return;
        }

        this.clearIntervalForTimerId(timer.id);

        if (!timer.active || (timer.onlyWhenLive &&
            !connectionManager.streamerIsOnline())) {
            return;
        }

        const interval = this.buildIntervalForTimer(timer);
        this.timerIntervalCache[timer.id] = interval;
    }

    /**
     * @param {Timer[]} timers
     * @param {boolean} onlyClearWhenLiveTimers
     */
    buildIntervalsForTimers(timers, onlyClearWhenLiveTimers = false) {
        // make sure any previous timers are cleared
        this.clearIntervals(onlyClearWhenLiveTimers);

        for (const timer of timers) {
        // skip inactive timers
            if (!timer.active) {
                continue;
            }

            // skip over timers that require the streamer to be live
            if (timer.onlyWhenLive && !connectionManager.streamerIsOnline()) {
                continue;
            }

            const intervalTracker = this.buildIntervalForTimer(timer);
            // add to our cache
            this.timerIntervalCache[timer.id] = intervalTracker;
        }
    }

    incrementChatLineCounters() {
        logger.debug("Incrementing timer chat line counters...");

        const currentIntervals = Object.values(this.timerIntervalCache);
        for (const interval of currentIntervals) {
            //increment counter
            interval.chatLinesSinceLastRunCount++;

            if (interval.waitingForChatLines) {
                //timer is waiting for chat lines, run it so it can do its checks
                this.runTimer(interval.timer);
            }
        }
    }

    startTimers() {
        const timers = this.getAllItems();
        if (timers != null) {
            this.buildIntervalsForTimers(timers.filter(t => t.active));
        }
    }
}

const timerManager = new TimerManager();

frontendCommunicator.onAsync("getTimers",
    async () => timerManager.getAllItems());

frontendCommunicator.onAsync("saveTimer",
    async (/** @type {Timer} */ timer) => await timerManager.saveItem(timer));

frontendCommunicator.onAsync("saveAllTimers",
    async (/** @type {Timer[]} */ allTimers) => await timerManager.saveAllItems(allTimers));

frontendCommunicator.on("deleteTimer",
    (/** @type {string} */ timerId) => timerManager.deleteItem(timerId));

// restart timers when the Streamer goes offline/online
connectionManager.on("streamerOnlineChange", isOnline => {
    if (isOnline) {
        logger.debug("Streamer has gone live.");

        // streamer went live, spool up intervals for only when live timers
        const timers = timerManager
            .getAllItems()
            .filter(t => t.active && t.onlyWhenLive);

        timerManager.buildIntervalsForTimers(timers, true);
    } else {
        logger.debug("Streamer has gone offline.");

        // streamer went offline
        // cancel intervals with timers set for only when live
        timerManager.clearIntervals(true);
    }
});

module.exports = timerManager;