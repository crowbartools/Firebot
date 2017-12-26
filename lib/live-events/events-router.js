'use strict';

const {ipcMain} = require('electron');
const dataAccess = require('../../lib/common/data-access.js');
const NodeCache = require("node-cache");

//const { EventType, EventSourceType } = require('./EventType');
const { TriggerType } = require('../common/EffectType');
const effectRunner = require('../common/effect-runner.js');

// This cache holds all users who have fired events and what events they fired.
// Deletes entries after 12 hours. Checks every 10 minutes.
const userEventCache = new NodeCache({ stdTTL: 43200, checkperiod: 600 });

// This cache holds the current json settings including effects for events.
let eventSettingsCache = {};

// Update Event Cache
function refreshEventCache (retry) {
    // FB: I've set a weird retry thing here because I ran into a rare issue where upon saving settings the app tried to
    // save and get the same file at the same time which threw errors and caused the cache to get out
    // of sync.
    if (retry == null) {
        retry = 1;
    }

    // Setup events db.
    let dbEvents = dataAccess.getJsonDbInUserData("/user-settings/live-events/events");

    try {
        if (retry <= 3) {
            try {
                // Update Cache
                eventSettingsCache = dbEvents.getData('/');
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
    return eventSettingsCache;
}

// Live Event Router
// Takes in all the info from events and routes it to effect runner.
function liveEventRouter (event) {
    //TODO: Get user saved event (if any), get effects for event
    let userEvent = null,
        effects = null,
        eventSetting;

    // Get effects for this event from the cached event settings.
    Object.keys(eventSettingsCache).forEach(k => {
        eventSetting = eventSettingsCache[k];
        if (eventSetting.active === true && eventSetting.eventType === event.type) {
            effects = eventSetting.effects;
        }
    });

    // If we still dont have effects, cancel sending the packet because nothing will run anyway.
    if (effects === null) {
        console.log('Couldnt find effects for event, ' + event.type + '.');
        return;
    }

    // Build the effect runner packet.
    effectRunner.processEffects({
        trigger: {
            type: TriggerType.EVENT,
            metadata: {
                username: event.metadata.username,
                eventType: event.type,
                eventSource: event.source,
                eventData: event.metadata,
                userEvent: userEvent
            },
            effects: effects
        }
    });

    // Send event to alert log.
    // We don't want to send stats UPDATEs to the log.
    let str = event.type,
        logEvent = str.toLowerCase();
    if (event.type === "SUBSCRIBED") {
        renderWindow.webContents.send('eventlog', {type: "alert", username: event.metadata.username, event: logEvent + "(x" + event.metadata.totalMonths + ")."});
    } else if (event.type !== "UPDATE") {
        renderWindow.webContents.send('eventlog', {type: "alert", username: event.metadata.username, event: logEvent + "."});
    }
}

// Cache Event
// This will cache the event so we don't fire it multiple times per session.
// Any event that needs to only fire once should run through this before hitting the live event router.
function cacheEvent(event) {
    /**
    Example of cache storage.
        {
            Firebottle: {
                constellation:{
                    FOLLOWED: true
                }
            },
            eBiggz: {
                constellation:{
                    SUBSCRIBED: true
                }
            }
        }
    **/

    let eventSource = event.source,
        eventType = event.type,
        username = event['metadata'].username;

    try {
        // This means we've cached an event for this user.
        let cacheEntry = userEventCache.get(username, true),
            cacheSource = cacheEntry[eventSource],
            cacheValue = cacheSource[eventType];

        if (cacheValue !== true) {
            // This event hasnt fired yet.

            // Create the cache object.
            const obj = {
                [eventSource]: {
                    [eventType]: true
                }
            };

            // Set the cache.
            userEventCache.set(username, obj);

            // Send it to the router.
            liveEventRouter(event);

            console.log(username + ' triggered ' + eventType + ' over ' + eventSource + '. Firing.');
        }
        console.log(username + ' triggered ' + eventType + ' over ' + eventSource + ' but they have already triggered it. Skipping.');
    } catch (err) {
        // This means we haven't cached this user yet.

        // Create the cache object.
        const obj = {
            [eventSource]: {
                [eventType]: true
            }
        };

        // Set the cache.
        userEventCache.set(username, obj);

        // Send it to the router.
        liveEventRouter(event);

        console.log('Uncached User: ' + username + ' triggered ' + eventType + ' over ' + eventSource + '. Firing.');
    }
}

// Refresh Event Cache
// This refreshes the event cache for the backend with frontend changes are saved.
ipcMain.on('refreshEventCache', function() {
    refreshEventCache();
});

// Export Functions
exports.getEventCache = getEventCache;
exports.uncachedEvent = liveEventRouter;
exports.cachedEvent = cacheEvent;