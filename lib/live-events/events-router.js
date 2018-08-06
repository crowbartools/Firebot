"use strict";

const { ipcMain } = require("electron");
const profileManager = require("../../lib/common/profile-manager.js");
const NodeCache = require("node-cache");
const logger = require("../logwrapper");
const EventHelper = require("./EventType");

const { EffectTrigger } = require("../effects/models/effectModels");
const effectRunner = require("../common/effect-runner.js");

// This cache holds all users who have fired events and what events they fired.
// Deletes entries after 12 hours. Checks every 10 minutes.
const userEventCache = new NodeCache({ stdTTL: 43200, checkperiod: 600 });

// This cache holds the current json settings including effects for events.
let eventSettingsCache = {};

// This cache holds the current active event group so we don't need to hit the settings file every time.

// Update Event Cache
function refreshEventCache(retry) {
  // FB: I've set a weird retry thing here because I ran into a rare issue where upon saving settings the app tried to
  // save and get the same file at the same time which threw errors and caused the cache to get out
  // of sync.
  if (retry == null) {
    retry = 1;
  }

  // Setup events db.
  let dbEvents = profileManager.getJsonDbInProfile("/live-events/events");

  try {
    if (retry <= 3) {
      try {
        // Update Cache
        eventSettingsCache = dbEvents.getData("/");
        logger.info("Updated events cache.");
      } catch (err) {
        logger.error(
          `Events cache update failed. Retrying. (Try ${retry++}/3)`
        );
        refreshEventCache(retry);
      }
    } else {
      renderWindow.webContents.send("error", "Could not sync up events cache.");
    }
  } catch (err) {
    logger.error(err);
  }
}

// Refresh immediately to get initial cache.
refreshEventCache();

// This returns the event cache.
function getEventCache() {
  return eventSettingsCache;
}

// Cache Event
// This will cache the event so we don't fire it multiple times per session.
// Any event that needs to only fire once should run through this before hitting the live event router.
function cacheNewEvent(sourceId, eventId, eventMetaKey = null) {
  /**
  Example of cache storage.
      {
          "constellation:FOLLOWED:Firebottle": true,
          "constellation:FOLLOWED:ebiggz": true
      }
  **/

  let key = `${sourceId}:${eventId}`;
  if (eventMetaKey != null) {
    key += `:${eventMetaKey}`;
  }

  let eventCached = userEventCache.get(key);
  if (!eventCached) {
    //event for this user hasnt fired yet
    // Update the cache.
    userEventCache.set(key, true);
  }
  return !eventCached;
}

function runEventEffects(effects, event, source, meta, isManual = false) {
  return new Promise(() => {
    // Build the effect runner packet.
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

    return runEventEffects(effects, event, source, meta).then(() => {
      return runQueue();
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

function onEventTriggered(event, source, meta, isManual = false) {
  if (event.cached) {
    let cacheMetaKey;
    if (event.cacheMetaKey && event.meta) {
      cacheMetaKey = meta[event.cacheMetaKey];
    }
    let previouslyCached = cacheNewEvent(source.id, event.id, cacheMetaKey);
    if (previouslyCached) {
      return;
    }
  }

  let effects = null,
    settingsDb = profileManager.getJsonDbInProfile("settings"),
    activeEventGroup = settingsDb.getData("/liveEvents/lastGroupId"),
    eventsGroup = eventSettingsCache[activeEventGroup],
    eventSettings = Object.values(eventsGroup.events).filter(
      es => es.active && es.sourceId === source.id && es.eventId === event.id
    );

  for (let eventSetting of eventSettings) {
    effects = eventSetting.effects;

    // If we still dont have effects, cancel sending the packet because nothing will run anyway.
    if (effects === null) {
      return;
    }

    if (event.queued && !isManual) {
      addEventToQueue({
        effects: effects,
        event: event,
        source: source,
        meta: meta
      });
    } else {
      runEventEffects(effects, event, source, meta, isManual);
    }
  }
}

// Live Event Router
// Takes in all the info from events and routes it to effect runner.
function liveEventRouter(event) {
  // Send event to alert log.
  // We don't want to send stats UPDATEs to the log.
  /*let str = event.type,
    logEvent = str.toLowerCase();

  if (event.skipLog !== true) {
    if (event.type === "SUBSCRIBED") {
      renderWindow.webContents.send("eventlog", {
        type: "alert",
        username: event.metadata.username,
        event: logEvent + "(x" + event.metadata.totalMonths + ")."
      });
    } else if (event.type !== "UPDATE") {
      renderWindow.webContents.send("eventlog", {
        type: "alert",
        username: event.metadata.username,
        event: logEvent + "."
      });
    }
  }

  // Throw chat alert if we have it active.
  if (event.chatFeedAlert === true) {
    if (event.type === "SUBSCRIBED") {
      renderWindow.webContents.send("chatUpdate", {
        fbEvent: "ChatAlert",
        message:
          event.metadata.username +
          " " +
          logEvent +
          "(x" +
          event.metadata.totalMonths +
          ")."
      });
    } else if (event.type !== "UPDATE") {
      renderWindow.webContents.send("chatUpdate", {
        fbEvent: "ChatAlert",
        message: event.metadata.username + " " + logEvent + "."
      });
    }
  }*/
}

// Cache Event
// This will cache the event so we don't fire it multiple times per session.
// Any event that needs to only fire once should run through this before hitting the live event router.
function cacheEvent(event, key) {}

// Manual Event Firing
/*function manualEvent(eventType) {
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
      event = new LiveEvent(
        EventType.SUBSCRIBED,
        EventSourceType.CONSTELLATION,
        {
          shared: true,
          username: "Streamer",
          totalMonths: 6
        }
      );

      liveEventRouter(event);
      break;
    case "INTERACTIVE_CONNECTED":
      event = new LiveEvent(
        EventType.INTERACTIVE_CONNECTED,
        EventSourceType.FIREBOT,
        { username: "Firebot" }
      );
      liveEventRouter(event);
      break;
    case "CHAT_CONNECTED":
      event = new LiveEvent(EventType.CHAT_CONNECTED, EventSourceType.FIREBOT, {
        username: "Firebot"
      });
      liveEventRouter(event);
      break;
    default:
      type = EventHelper.getEventById(eventType);
      if (type != null) {
        let sources = EventHelper.getSourceTypesForEvent(type.id);
        event = new LiveEvent(EventType[type.id], sources[0], {
          username: "Streamer"
        });
        liveEventRouter(event);
      } else {
        logger.error("Invalid event sent to manual event trigger.");
      }
      break;
  }
}*/

// Refresh Event Cache
// This refreshes the event cache for the backend with frontend changes are saved.
ipcMain.on("refreshEventCache", function() {
  refreshEventCache();
});

// Export Functions
exports.getEventCache = getEventCache;
exports.uncachedEvent = liveEventRouter;
exports.cachedEvent = cacheEvent;
exports.onEventTriggered = onEventTriggered;
