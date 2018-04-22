"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const commandAccess = require("../data-access/command-access");
const commandManager = require("./command-manager");
const MixerChat = require("../common/mixer-chat");
const util = require("../utility");

let timerIntervalCache = {};

function clearIntervals() {
  let intervals = Object.values(timerIntervalCache);
  intervals.forEach(i => clearInterval(i.intervalId));
  timerIntervalCache = {};
}

// this is the function we run on every interval of a timer
function runTimer(timer) {
  // if the passed timer is null, stop
  if (timer == null) return;

  // get the saved interval for this timer id
  let interval = timerIntervalCache[timer.id];
  if (interval == null) return;

  // check if we need to generate a new queue
  if (interval.commandQueue.length === 0) {
    // We need to make a new queue
    if (timer.randomize) {
      interval.commandQueue = util.shuffleArray(timer.commands);
    } else {
      // set queue to a copy of the commands array
      interval.commandQueue = timer.commands.slice(0);
    }
  }

  // gets the next command id from beginning of queue and removes it
  let nextCommandId = interval.commandQueue.shift();

  // triggers the command
  commandManager.triggerCustomCommand(nextCommandId, true, false);
}

function startTimers() {
  // make sure any previous timers are cleared
  clearIntervals();

  // get all timers
  let timers = commandAccess.getTimers();
  for (let timer of timers) {
    if (!timer.active) {
      // we dont care about inactive timers
      continue;
    }

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
      intervalId: intervalId,
      commandQueue: []
    };

    // add to our cache
    timerIntervalCache[timer.id] = intervalTracker;
  }
}

// Refresh command cooldown cache when changes happened on the front end
ipcMain.on("refreshCommandCache", function() {
  if (MixerChat.getChatStatus()) {
    startTimers();
  }
});

exports.startTimers = startTimers;
exports.stopTimers = () => clearIntervals();
