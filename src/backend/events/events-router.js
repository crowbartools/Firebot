"use strict";

const NodeCache = require("node-cache");
const { EffectTrigger } = require("../../shared/effect-constants");
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
          "twitch:FOLLOWED:9f7a8640-3e59-11ea-ae88-19476d11930a:Mage": true,
          "twitch:FOLLOWED:9f7a8640-3e59-11ea-ae88-19476d11930a:ebiggz": true
      }
    **/

    let key = `${sourceId}:${eventId}:${eventSettingId}`;
    if (eventMetaKey != null) {
        key += `:${eventMetaKey}`;
    }

    const eventCached = userEventCache.get(key);
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

function cacheActivityFeedEvent(source, event, meta) {
    if (event.cached) {
        let cacheMetaKey;
        if (event.cacheMetaKey && meta) {
            cacheMetaKey = meta[event.cacheMetaKey];
        }
        return cacheNewEvent(
            source.id,
            event.id,
            "activity-feed",
            event.cacheTtlInSecs,
            cacheMetaKey
        );
    }
    return false;
}

async function onEventTriggered(event, source, meta, isManual = false, isRetrigger = false, isSimulation = false) {

    let effects = null;

    if (meta == null) {
        meta = {};
    }

    const eventSettings = eventsAccess.getAllActiveEvents().filter(
        es => es.sourceId === source.id && es.eventId === event.id
    );

    const effectPromises = [];
    for (const eventSetting of eventSettings) {

        if (eventSetting.filterData && (isSimulation || !isManual)) {
            const passed = await filterManager.runFilters(eventSetting.filterData, {
                eventSourceId: source.id,
                eventId: event.id,
                eventMeta: meta
            });
            if (!passed) {
                continue;
            }
        }

        if (!isRetrigger && !isSimulation && !isManual && (eventSetting.customCooldown || event.cached)) {
            let cacheTtlInSecs;
            let cacheMetaKey;

            if (eventSetting.customCooldown) {
                cacheTtlInSecs = eventSetting.customCooldownSecs;
                cacheMetaKey = eventSetting.customCooldownPerUser ? meta["username"] : null;
            } else {
                cacheTtlInSecs = event.cacheTtlInSecs;
                cacheMetaKey = event.cacheMetaKey && meta ? meta[event.cacheMetaKey] : null;
            }

            const alreadyCached = cacheNewEvent(source.id, event.id, eventSetting.id, cacheTtlInSecs, cacheMetaKey);
            if (alreadyCached) {
                continue;
            }
        }

        effects = eventSetting.effects;

        // If we still don't have effects, cancel sending the packet because nothing will run anyway.
        if (effects === null) {
            continue;
        }

        effectPromises.push(runEventEffects(effects, event, source, meta, isManual));
    }

    try {
        await Promise.all(effectPromises);
    } catch (error) {}
}

// Export Functions
exports.onEventTriggered = onEventTriggered;
exports.runEventEffects = runEventEffects;
exports.cacheActivityFeedEvent = cacheActivityFeedEvent;
