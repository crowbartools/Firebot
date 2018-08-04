"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const commandAccess = require("../data-access/command-access");
const timerAccess = require("../data-access/timer-access");
const connectionManager = require("../common/connection-manager");
const accountAccess = require("../common/account-access");
const util = require("../utility");
const { TriggerType } = require("../common/EffectType");
const effectRunner = require("../common/effect-runner");

let timerIntervalCache = {};

function clearIntervals(onlyClearWhenLiveTimers = false) {
  let intervals;
  if (onlyClearWhenLiveTimers) {
    intervals = Object.values(timerIntervalCache).filter(i => i.onlyWhenLive);
  } else {
    intervals = Object.values(timerIntervalCache);
  }

  console.log("clearing: ", intervals);
  intervals.forEach(i => {
    clearInterval(i.intervalId);
    delete timerIntervalCache[i.timerId];
  });
}

function runAction(action, timer) {
  let effects = [];
  switch (action.type) {
    case "Run Effects": {
      effects = action.metadata.effects;
      break;
    }
    case "Run Command": {
      let selectedCommandId = action.metadata.commandId;

      let command = commandAccess.getCustomCommand(selectedCommandId);

      if (command != null) {
        effects = command.effects;
      }

      break;
    }
    case "Run Button": {
      let selectedButton = hotkey.action.metadata.button;

      let boardId = selectedButton.board.id;

      let interactiveCache = Interactive.getInteractiveCache();

      if (boardId !== interactiveCache.versionid) {
        renderWindow.webContents.send(
          "error",
          "Attempted to use a Timer for button in a board that is not currently active."
        );
        return;
      }

      let buttons = Object.values(interactiveCache.firebot.controls);

      let button = buttons.find(b => b.controlId === selectedButton.id);

      if (button != null) {
        effects = Object.values(button.effects);
      }

      break;
    }
    default:
      logger.error("This timer action type is not yet supported!");
      return;
  }

  let processEffectsRequest = {
    trigger: {
      type: TriggerType.TIMER,
      metadata: {
        username: accountAccess.getAccounts().streamer.username,
        timer: timer
      }
    },
    effects: effects
  };
  effectRunner.processEffects(processEffectsRequest);
}

// this is the function we run on every interval of a timer
function runTimer(timer) {
  // if the passed timer is null, stop
  if (timer == null) return;

  // get the saved interval for this timer id
  let interval = timerIntervalCache[timer.id];
  if (interval == null) return;

  // check if we need to generate a new queue
  if (interval.actionQueue.length === 0) {
    // We need to make a new queue
    if (timer.randomize) {
      interval.actionQueue = util.shuffleArray(timer.actions);
    } else {
      // set queue to a copy of the commands array
      interval.actionQueue = timer.actions.slice(0);
    }
  }

  // gets the next command id from beginning of queue and removes it
  let nextAction = interval.actionQueue.shift();

  // run the next action
  runAction(nextAction, timer);
}

function buildIntervalsForTimers(timers, onlyClearWhenLiveTimers = false) {
  // make sure any previous timers are cleared
  clearIntervals();

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
    let intervalId = setInterval(runTimer, timer.interval * 60000, timer);

    // Create our object that will track the interval and its progress
    let intervalTracker = {
      timerId: timer.id,
      onlyWhenLive: timer.onlyWhenLive,
      intervalId: intervalId,
      actionQueue: []
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
connectionManager.connectionStream.on("streamerOnlineChange", isOnline => {
  if (isOnline) {
    // streamer went live, spool up intervals for only when live timers
    let timers = timerAccess
      .getTimers()
      .filter(t => t.active && t.onlyWhenLive);

    buildIntervalsForTimers(timers, true);
  } else {
    // streamer went offline
    // cancel intervals with timers set for only when live
    clearIntervals(true);
  }
});

exports.startTimers = startTimers;
exports.stopTimers = () => clearIntervals();
