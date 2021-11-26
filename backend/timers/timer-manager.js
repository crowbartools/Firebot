"use strict";

const logger = require("../logwrapper");
const timerAccess = require("./timer-access");
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

    intervalsToClear.forEach(i => {
        clearInterval(i.intervalId);
        delete timerIntervalCache[i.timerId];
    });
}

function clearIntervalForTimerId(timerId) {
    const intervalData = timerIntervalCache[timerId];
    if (intervalData == null) {
        return;
    }
    clearInterval(intervalData.intervalId);
    delete timerIntervalCache[intervalData.timerId];
}

// this is the function we run on every interval of a timer
function runTimer(timer) {
    logger.debug(`Running timer ${timer.name}`);
    // if the passed timer is null, stop
    if (timer == null) {
        return;
    }

    // get the saved interval for this timer id
    let interval = timerIntervalCache[timer.id];
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
            let intervalId = setInterval(runTimer, timer.interval * 1000, timer);
            interval.intervalId = intervalId;
            interval.waitingForChatLines = false;
            logger.debug(`Chat line requirement has been met for timer "${timer.name}". Running effects and restarting interval.`);
        }
    }

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

function buildIntervalForTimer(timer) {
    /**
         * Create the interval.
         * The first argument "runTimer" is the function defined above.
         * The second argument is how often the user defined this timer to run (mins converted to milliseconds)
         * The third argument "timer" is the timer object getting passed as an argument to the "runTimer" fuction
         *
         * the setInterval function returns an id that we use to clear the interval when needed
         */
    const intervalId = setInterval(runTimer, timer.interval * 1000, timer);

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

function updateIntervalForTimer(timer) {
    if (timer == null) {
        return;
    }
    clearIntervalForTimerId(timer.id);
    if (!timer.active || (timer.onlyWhenLive &&
        !connectionManager.streamerIsOnline())) {
        return;
    }
    const interval = buildIntervalForTimer(timer);
    timerIntervalCache[timer.id] = interval;
}

function buildIntervalsForTimers(timers, onlyClearWhenLiveTimers = false) {
    // make sure any previous timers are cleared
    clearIntervals(onlyClearWhenLiveTimers);

    for (let timer of timers) {
    // skip inactive timers
        if (!timer.active) {
            continue;
        }

        // skip over timers that require the streamer to be live
        if (timer.onlyWhenLive && !connectionManager.streamerIsOnline()) {
            continue;
        }

        const intervalTracker = buildIntervalForTimer(timer);

        // add to our cache
        timerIntervalCache[timer.id] = intervalTracker;
    }
}

function incrementChatLineCounters() {
    logger.debug("Incrementing timer chat line counters...");
    const currentIntervals = Object.values(timerIntervalCache);
    for (const interval of currentIntervals) {
        //increment counter
        interval.chatLinesSinceLastRunCount++;
        if (interval.waitingForChatLines) {
            //timer is waiting for chat lines, run it so it can do its checks
            runTimer(interval.timer);
        }
    }
}

function startTimers() {
    // get all active timers
    let timers = timerAccess.getTimers().filter(t => t.active);
    buildIntervalsForTimers(timers);
}

timerAccess.on("timerSaved", timer => {
    updateIntervalForTimer(timer);
});

timerAccess.on("timerDeleted", timerId => {
    clearIntervalForTimerId(timerId);
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
exports.incrementChatLineCounters = incrementChatLineCounters;
exports.updateIntervalForTimer = updateIntervalForTimer;