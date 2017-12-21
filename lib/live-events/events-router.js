'use strict';

const {ipcMain} = require('electron');
const dataAccess = require('../../lib/common/data-access.js');

let eventCache = [];

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
    switch (event.type) {

    case "update": {
        // Update
        // Note that this provides pretty much all changes to the channel including things like profile changes.
        // Main thing that could be useful would be channel online/offline status and viewer/follow stats.
        let numFollowers = event.metadata.numFollowers,
            viewersCurrent = event.metadata.viewersCurrent,
            viewersTotal = event.metadata.viewersTotal,
            online = event.metadata.online;

        if (numFollowers != null) {
            console.log('Num Followers: ' + numFollowers);
        }
        if (viewersCurrent != null) {
            console.log('Viewers Current: ' + viewersCurrent);
        }
        if (viewersTotal != null) {
            console.log('Viewers Total: ' + viewersTotal);
        }
        if (online != null) {
            if (online === false) {
                console.log('Channel has gone offline.');
            } else {
                console.log('Channel has gone online!');
            }
        }
        break;
    }
    case "followed": {
        // Follow
        // This returns the entire user object with additional parameter of follow = true or false.
        // Note we could pull sparks, creation date, levels, etc...
        if (event.metadata.following === true) {
            console.log(event.metadata.username + ' followed the channel!');
        }
        break;
    }
    case "hosted": {
        // Hosted
        // This returns a channel object (not user).
        // We could get things like partner status here.
        console.log(event.metadata.username + ' hosted the channel!');
        break;
    }
    case "subscribed": {
        // Subscribed
        // Returns user object.
        // This is the initial subscription. We can assume that this person is in the channel when this happens.
        console.log(event.metadata.username + ' subscribed to the channel!');
        break;
    }
    case "resubscribed": {
        // Resubscribe
        // This is fired when payment goes through, but does not meant the person is in chat. Returns user object.
        // Returns user object, total months, date started, and other stats.
        console.log(event.metadata.username + ' resubscribed to the channel for ' + event.metadata.totalMonths + ' months!');
        break;
    }
    case "resubShared": {
        // Resub Shared
        // This is when a user clicks the share button. Person has to be in channel to trigger this one.
        // Returns user object, total months, date started, and other stats.
        console.log(event.metadata.username + ' shared a resub to the channel for ' + event.metadata.totalMonths + ' months!');
        break;
    }
    default: {
        console.log(event);
    }
    }
}

// Refresh Event Cache
// This refreshes the event cache for the backend with frontend changes are saved.
ipcMain.on('refreshEventCache', function() {
    refreshEventCache();
});

// Export Functions
exports.go = liveEventRouter;
exports.getEventCache = getEventCache;