"use strict";
const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const profileManager = require("../common/profile-manager");

let getTimersDb = () => profileManager.getJsonDbInProfile("timers");

// in memory timer storage
let timerCache = [];

// Refreshes the timers cache
function refreshTimerCache(retry = 1) {
    // FB: I've set a weird retry thing here because I ran into a rare issue where upon saving settings the app tried to
    // save and get the same file at the same time which threw errors and caused the cache to get out
    // of sync.

    // Get commands file
    let timersDb = getTimersDb();

    // We've got the last used board! Let's update the interactive cache.
    if (timersDb != null) {
        if (retry <= 3) {
            let timerData;
            try {
                timerData = timersDb.getData("/");
            } catch (err) {
                logger.info(
                    "Timer cache update failed. Retrying. (Try " + retry + "/3)"
                );
                retry = retry + 1;
                logger.error("error getting timer data", err);
                refreshTimerCache(retry);
                return;
            }

            if (timerData) {
                timerCache = Object.values(timerData);
            }

            logger.info("Updated Timer cache.");
        } else {
            renderWindow.webContents.send("error", "Could not sync up timer cache.");
        }
    }
}

refreshTimerCache();

// Refresh Timer Cache
ipcMain.on("refreshTimerCache", function() {
    refreshTimerCache();
});

exports.refreshTimerCache = refreshTimerCache;
exports.getTimers = () => timerCache;
