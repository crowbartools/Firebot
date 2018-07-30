'use strict';

const {ipcMain} = require('electron');
const dataAccess = require('../../lib/common/data-access.js');
const NodeCache = require("node-cache");
const logger = require('../logwrapper');
const { LiveEvent, EventSourceType, EventType } = require('./EventType');
const EventHelper = require('./EventType');

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
                logger.info('Updated events cache.');

            } catch (err) {
                logger.error(`Events cache update failed. Retrying. (Try ${retry++}/3)`);
                refreshEventCache(retry);
            }
        } else {
            renderWindow.webContents.send('error', "Could not sync up events cache.");
        }
    } catch (err) {
        logger.error(err);
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
            }
        },
        effects: effects
    });

    // Send event to alert log.
    // We don't want to send stats UPDATEs to the log.
    let str = event.type,
        logEvent = str.toLowerCase();

    if (event.skipLog !== true) {
        if (event.type === "SUBSCRIBED") {
            renderWindow.webContents.send('eventlog', {type: "alert", username: event.metadata.username, event: logEvent + "(x" + event.metadata.totalMonths + ")."});
        } else if (event.type !== "UPDATE") {
            renderWindow.webContents.send('eventlog', {type: "alert", username: event.metadata.username, event: logEvent + "."});
        }
    }

    // Throw chat alert if we have it active.
    if (event.chatFeedAlert === true) {
        if (event.type === "SUBSCRIBED") {
            renderWindow.webContents.send('chatUpdate', {fbEvent: "ChatAlert", message: event.metadata.username + " " + logEvent + "(x" + event.metadata.totalMonths + ")."});
        } else if (event.type !== "UPDATE") {
            renderWindow.webContents.send('chatUpdate', {fbEvent: "ChatAlert", message: event.metadata.username + " " + logEvent + "."});
        }
    }
}

// Cache Event
// This will cache the event so we don't fire it multiple times per session.
// Any event that needs to only fire once should run through this before hitting the live event router.
function cacheEvent(event, key) {
    /**
    Example of cache storage.
        {
            "constellation:FOLLOWED:Firebottle": true,
            "constellation:FOLLOWED:ebiggz": true
        }
    **/
    if (key == null) {

        let eventSource = event.source,
            eventType = event.type,
            user = event['metadata'].username;

        key = `${eventSource}:${eventType}:${user}`;
    }

    let eventCached = userEventCache.get(key);
    if (eventCached !== true) {
        //event for this user hasnt fired yet

        // Update the cache.
        userEventCache.set(key, true);

        // Send it to the router.
        liveEventRouter(event);
    }
}

// Manual Event Firing
function manualEvent(eventType) {
    let event;
    let type;
    switch (eventType) {
    case "FOLLOWED":
        event = new LiveEvent(EventType.FOLLOWED, EventSourceType.CONSTELLATION, {
            username: "Streamer"
        });

        liveEventRouter(event);
        break;
    case "HOSTED":
        event = new LiveEvent(EventType.HOSTED, EventSourceType.CONSTELLATION, {
            username: "Streamer"
        });

        liveEventRouter(event);
        break;
    case "SUBSCRIBED":
        event = new LiveEvent(EventType.SUBSCRIBED, EventSourceType.CONSTELLATION, {
            shared: true,
            username: "Streamer",
            totalMonths: 6
        });

        liveEventRouter(event);
        break;
    case "INTERACTIVE_CONNECTED":
        event = new LiveEvent(EventType.INTERACTIVE_CONNECTED, EventSourceType.FIREBOT, {username: "Firebot"});
        liveEventRouter(event);
        break;
    case "CHAT_CONNECTED":
        event = new LiveEvent(EventType.CHAT_CONNECTED, EventSourceType.FIREBOT, {username: "Firebot"});
        liveEventRouter(event);
        break;
    default:

        type = EventHelper.getEventById(eventType);
        if (type != null) {
            let sources = EventHelper.getSourceTypesForEvent(type.id);
            event = new LiveEvent(EventType[type.id],
                sources[0],
                {username: "Streamer"});
            liveEventRouter(event);
        } else {
            logger.error("Invalid event sent to manual event trigger.");
        }
        break;
    }
}

// Refresh Event Cache
// This refreshes the event cache for the backend with frontend changes are saved.
ipcMain.on('refreshEventCache', function() {
    refreshEventCache();
});

// Manually Activate an Event for Testing
// This will manually trigger an event for testing purposes.
ipcMain.on('manualEvent', function(event, eventType) {
    manualEvent(eventType);
});

// Export Functions
exports.getEventCache = getEventCache;
exports.uncachedEvent = liveEventRouter;
exports.cachedEvent = cacheEvent;