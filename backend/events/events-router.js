"use strict";

const NodeCache = require("node-cache");
const logger = require("../logwrapper");
const { EffectTrigger } = require("../effects/models/effectModels");
const filterManager = require("./filters/filter-manager");
const eventsAccess = require("./events-access");

// This cache holds all users who have fired events and what events they fired.
// Deletes entries after 12 hours. Checks every 10 minutes.
const userEventCache = new NodeCache({ stdTTL: 43200, checkperiod: 600 });

// Cache Event
// This will cache the event so we don't fire it multiple times per session.
// Any event that needs to only fire once should run through this before hitting the live event router.
function cacheNewEvent(sourceId, eventId, eventSettingId, ttlInSecs = undefined, eventMetaKey = null) {
    /**
    Example of cache storage.
      {
          "constellation:FOLLOWED:9f7a8640-3e59-11ea-ae88-19476d11930a:Firebottle": true,
          "constellation:FOLLOWED:9f7a8640-3e59-11ea-ae88-19476d11930a:ebiggz": true
      }
    **/

    let key = `${sourceId}:${eventId}:${eventSettingId}`;
    if (eventMetaKey != null) {
        key += `:${eventMetaKey}`;
    }

    let eventCached = userEventCache.get(key);
    if (!eventCached) {
        // event for this user hasnt fired yet
        // Update the cache.
        userEventCache.set(key, true, ttlInSecs);
    }
    return eventCached;
}

function runEventEffects(effects, event, source, meta, isManual = false) {
    const effectRunner = require("../common/effect-runner.js");
    return effectRunner.processEffects({
        trigger: {
            type: isManual ? EffectTrigger.MANUAL : EffectTrigger.EVENT,
            metadata: {
                username: meta.username,
                userId: meta.userId,
                event: { id: event.id, name: event.name },
                eventSource: { id: source.id, name: source.name },
                eventData: meta
            }
        },
        effects: effects
    });
}

let eventQueue = [];
let queueRunning = false;

// runs queue'd events till queue is empty
function runQueue() {
    return new Promise(resolve => {
        if (eventQueue.length === 0) {
            return resolve();
        }

        let nextEventPacket = eventQueue.shift();

        let effects = nextEventPacket.effects,
            event = nextEventPacket.event,
            source = nextEventPacket.source,
            meta = nextEventPacket.meta;

        runEventEffects(effects, event, source, meta).then(() => {
            resolve(runQueue());
        });
    });
}

function addEventToQueue(eventPacket) {
    eventQueue.push(eventPacket);

    if (!queueRunning) {
        queueRunning = true;
        runQueue().then(() => {
            queueRunning = false;
        });
    }
}

async function onEventTriggered(event, source, meta, isManual = false) {

    let effects = null,
        eventSettings;

    if (meta == null) {
        meta = {};
    }

    eventSettings = eventsAccess.getAllActiveEvents().filter(
        es => es.sourceId === source.id && es.eventId === event.id
    );

    for (let eventSetting of eventSettings) {

        if (!isManual && event.cached) {
            let cacheMetaKey;
            if (event.cacheMetaKey && meta) {
                cacheMetaKey = meta[event.cacheMetaKey];
            }
            let previouslyCached = cacheNewEvent(source.id, event.id, eventSetting.id, event.cacheTtlInSecs, cacheMetaKey);
            if (previouslyCached) {
                return;
            }
        }

        if (eventSetting.filterData && !isManual) {
            let passed = await filterManager.runFilters(eventSetting.filterData, {
                eventSourceId: source.id,
                eventId: event.id,
                eventMeta: meta
            });
            if (!passed) {
                continue;
            }
        }

        effects = eventSetting.effects;

        // If we still dont have effects, cancel sending the packet because nothing will run anyway.
        if (effects === null) {
            continue;
        }

        runEventEffects(effects, event, source, meta, isManual);

        // send to ui log
        if (!eventSetting.skipLog) {
            renderWindow.webContents.send('eventlog', {
                type: "alert",
                username: (meta.username || "") + " triggered the event",
                event: eventSetting.name
            });
        }

        // Send chat alert
        if (eventSetting.chatFeedAlert) {
            renderWindow.webContents.send('chatUpdate', {
                fbEvent: "ChatAlert",
                message: `The event "${eventSetting.name}" was triggered${meta.username ? ` by ${meta.username}` : ""}`
            });
        }
    }
}

// Export Functions
exports.onEventTriggered = onEventTriggered;
exports.runEventEffects = runEventEffects;
