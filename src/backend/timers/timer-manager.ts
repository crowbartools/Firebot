import { DateTime } from "luxon";

import { Timer, TimerIntervalTracker } from "../../types/timers";
import { TriggerType } from "../common/EffectType";
import JsonDbManager from "../database/json-db-manager";
import logger from "../logwrapper";
import connectionManager from "../common/connection-manager";
import accountAccess from "../common/account-access";
import effectRunner from "../common/effect-runner";
import frontendCommunicator from "../common/frontend-communicator";

class TimerManager extends JsonDbManager<Timer> {
    private timerIntervalCache = {};

    constructor() {
        super("Timer", "timers");

        this.timerIntervalCache = {};
    }

    saveItem(timer: Timer): Timer | null {
        const savedTimer = super.saveItem(timer);

        if (savedTimer != null) {
            this.updateIntervalForTimer(timer);
            return savedTimer;
        }

        return null;
    }

    deleteItem(timerId: string): boolean {
        const itemDeleted = super.deleteItem(timerId);

        if (itemDeleted) {
            this.clearIntervalForTimerId(timerId);
            return true;
        }

        return false;
    }

    triggerUiRefresh(): void {
        frontendCommunicator.send("all-timers-updated", this.getAllItems());
    }

    updateTimerActiveStatus(timerId: string, active = false): void {
        const timer = this.getItem(timerId);

        if (timer != null) {
            timer.active = active;

            const savedTimer = this.saveItem(timer);
            if (savedTimer != null) {
                frontendCommunicator.send("timerUpdate", timer);
            }
        }
    }

    clearIntervals(onlyClearWhenLiveTimers = false): void {
        let intervalsToClear: TimerIntervalTracker[];
        if (onlyClearWhenLiveTimers) {
            intervalsToClear = Object.keys(this.timerIntervalCache)
                .map(x => this.timerIntervalCache[x])
                .filter(i => i.onlyWhenLive);
        } else {
            intervalsToClear = Object.keys(this.timerIntervalCache)
                .map(x => this.timerIntervalCache[x]);
        }

        intervalsToClear.forEach((i) => {
            clearInterval(i.intervalId);
            delete this.timerIntervalCache[i.timerId];
        });
    }

    clearIntervalForTimerId(timerId: string) {
        const intervalData = this.timerIntervalCache[timerId];
        if (intervalData == null) {
            return;
        }
        clearInterval(intervalData.intervalId);
        delete this.timerIntervalCache[intervalData.timerId];
    }

    runTimer(timer: Timer): void {
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
                        userId: accountAccess.getAccounts().streamer.userId,
                        userDisplayName: accountAccess.getAccounts().streamer.displayName,
                        timer: timer
                    }
                },
                effects: timer.effects
            };
            effectRunner.processEffects(effectsRequest);
        }
    }

    buildIntervalForTimer(timer: Timer): TimerIntervalTracker {
        /**
         * Create the interval.
         * The first argument "runTimer" is the function defined above.
         * The second argument is how often the user defined this timer to run (mins converted to milliseconds)
         * The third argument "timer" is the timer object getting passed as an argument to the "runTimer" function
         *
         * the setInterval function returns an id that we use to clear the interval when needed
         */
        const intervalId = setInterval(this.runTimer.bind(this), timer.interval * 1000, timer);

        // Create our object that will track the interval and its progress
        const intervalTracker: TimerIntervalTracker = {
            timerId: timer.id,
            onlyWhenLive: timer.onlyWhenLive,
            timer: timer,
            requiredChatLines: timer.requiredChatLines,
            waitingForChatLines: false,
            chatLinesSinceLastRunCount: 0,
            intervalId: intervalId,
            startedAt: DateTime.utc()
        };

        return intervalTracker;
    }

    updateIntervalForTimer(timer: Timer): void {
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

    buildIntervalsForTimers(timers: Timer[], onlyClearWhenLiveTimers = false): void {
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

    incrementChatLineCounters(): void {
        logger.debug("Incrementing timer chat line counters...");

        const currentIntervals: TimerIntervalTracker[] = Object.values(this.timerIntervalCache);
        for (const interval of currentIntervals) {
            //increment counter
            interval.chatLinesSinceLastRunCount++;

            if (interval.waitingForChatLines) {
                //timer is waiting for chat lines, run it so it can do its checks
                this.runTimer(interval.timer);
            }
        }
    }

    startTimers(): void {
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
    async (timer: Timer) => timerManager.saveItem(timer));

frontendCommunicator.onAsync("saveAllTimers",
    async (allTimers: Timer[]) => timerManager.saveAllItems(allTimers));

frontendCommunicator.on("deleteTimer",
    (timerId: string) => timerManager.deleteItem(timerId));

// restart timers when the Streamer goes offline/online
connectionManager.on("streamerOnlineChange", (isOnline: boolean) => {
    if (isOnline) {
        logger.debug("Streamer has gone live.");

        // streamer went live, spool up intervals for only when live timers
        const timers = timerManager.getAllItems().filter(t => t.active && t.onlyWhenLive);

        timerManager.buildIntervalsForTimers(timers, true);
    } else {
        logger.debug("Streamer has gone offline.");

        // streamer went offline
        // cancel intervals with timers set for only when live
        timerManager.clearIntervals(true);
    }
});

export = timerManager;