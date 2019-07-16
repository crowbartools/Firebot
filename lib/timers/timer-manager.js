"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const timerAccess = require("../data-access/timer-access");
const connectionManager = require("../common/connection-manager");
const accountAccess = require("../common/account-access");
const { TriggerType } = require("../common/EffectType");
const effectRunner = require("../common/effect-runner");
const moment = require("moment");

let timerIntervalCache = {};

function clearIntervals(onlyClearWhenLiveTimers = false) {
    let intervalsToClear;
    if (onlyClearWhenLiveTimers) {
        intervalsToClear = Object.values(timerIntervalCache).filter(i => i.onlyWhenLive);
    } else {
        intervalsToClear = Object.values(timerIntervalCache);
    }

    console.log("clearing: ", intervalsToClear);
    intervalsToClear.forEach(i => {
        clearInterval(i.intervalId);
        delete timerIntervalCache[i.timerId];
    });
}

// this is the function we run on every interval of a timer
function runTimer(timer) {
    logger.debug(`Running timer ${timer.name}`);
    // if the passed timer is null, stop
    if (timer == null) return;

    // get the saved interval for this timer id
    let interval = timerIntervalCache[timer.id];
    if (interval == null) return;

    if (timer.effects) {
        let processEffectsRequest = {
            trigger: {
                type: TriggerType.TIMER,
                metadata: {
                    username: accountAccess.getAccounts().streamer.username,
                    timer: timer
                }
            },
            effects: timer.effects
        };
        effectRunner.processEffects(processEffectsRequest);
    }
}

function buildIntervalsForTimers(timers, onlyClearWhenLiveTimers = false) {
    // make sure any previous timers are cleared
    clearIntervals(onlyClearWhenLiveTimers);

    for (let timer of timers) {
    // skip inactive timers
        if (!timer.active) continue;

        // skip over timers that require the streamer to be live
        if (timer.onlyWhenLive && !connectionManager.streamerIsOnline()) continue;
        /**
         * Create the interval.
         * The first argument "runTimer" is the function defined above.
         * The second argument is how often the user defined this timer to run (mins converted to milliseconds)
         * The third argument "timer" is the timer object getting passed as an argument to the "runTimer" fuction
         *
         * the setInterval function returns an id that we use to clear the interval when needed
         */
        let intervalId = setInterval(runTimer, timer.interval * 1000, timer);

        // Create our object that will track the interval and its progress
        let intervalTracker = {
            timerId: timer.id,
            onlyWhenLive: timer.onlyWhenLive,
            intervalId: intervalId,
            startedAt: moment()
        };

        // add to our cache
        timerIntervalCache[timer.id] = intervalTracker;
    }
}

function startTimers() {
    // get all active timers
    timerAccess.refreshTimerCache();
    let timers = timerAccess.getTimers().filter(t => t.active);
    buildIntervalsForTimers(timers);
}

// Refresh command cooldown cache when changes happened on the front end
ipcMain.on("refreshTimerCache", function() {
    startTimers();
});

// restart timers when the Streamer goes offline/online
connectionManager.on("streamerOnlineChange", isOnline => {
    if (isOnline) {
        logger.debug("Streamer has gone live.");
        // streamer went live, spool up intervals for only when live timers
        let timers = timerAccess
            .getTimers()
            .filter(t => t.active && t.onlyWhenLive);

        buildIntervalsForTimers(timers, true);
    } else {
        logger.debug("Streamer has gone offline.");
        // streamer went offline
        // cancel intervals with timers set for only when live
        clearIntervals(true);
    }
});

exports.startTimers = startTimers;
exports.stopTimers = () => clearIntervals();