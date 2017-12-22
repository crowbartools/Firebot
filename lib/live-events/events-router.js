'use strict';

const {ipcMain} = require('electron');
const dataAccess = require('../../lib/common/data-access.js');

const { EventType, EventSourceType } = require('./EventType');

let eventCache = {};

// Update Event Cache
function refreshEventCache (retry) {
    // FB: I've set a weird retry thing here because I ran into a rare issue where upon saving settings the app tried to
    // save and get the same file at the same time which threw errors and caused the cache to get out
    // of sync.
    if (retry == null) {
        retry = 1;
    }

    // Get last board name.
    let dbEvents = dataAccess.getJsonDbInUserData("/user-settings/live-events/events");

    try {
        // We've got the last used board! Let's update the interactive cache.
        if (retry <= 3) {
            try {
                // Get settings for last board.
                eventCache = dbEvents.getData('/');
                console.log('Updated events cache.');

            } catch (err) {
                console.log(`Events cache update failed. Retrying. (Try ${retry++}/3)`);
                refreshEventCache(retry);
            }
        } else {
            renderWindow.webContents.send('error', "Could not sync up events cache.");
        }
    } catch (err) {
        console.log(err.message);
    }
}

// Refresh immediately to get initial cache.
refreshEventCache();

// This returns the event cache.
function getEventCache () {
    return eventCache;
}

// Live Event Router
// Takes in all the info from the constellation connection and routes is as needed.
function liveEventRouter (event) {
    //console.log(event);
    //console.log(eventCache);

    //TODO: Get user saved event (if any)
    //create object to send over to effects-runner.

}

// Refresh Event Cache
// This refreshes the event cache for the backend with frontend changes are saved.
ipcMain.on('refreshEventCache', function() {
    refreshEventCache();
});

// Export Functions
exports.go = liveEventRouter;
exports.getEventCache = getEventCache;