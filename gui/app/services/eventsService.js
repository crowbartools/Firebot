"use strict";

(function() {
  //This handles events
  const _ = require("underscore")._;
  const EventType = require("../../lib/live-events/EventType.js");
  const profileManager = require("../../lib/common/profile-manager.js");
  const { ipcRenderer } = require("electron");

  angular.module("firebotApp").factory("eventsService", function(logger) {
    let service = {},
      eventsCache = false;

    /**
     * Returns entire json of event groups.
     */
    service.getAllEventGroups = function() {
      // Cache events cache if it hasn't been already.
      if (eventsCache === false) {
        let dbEvents = profileManager.getJsonDbInProfile("/live-events/events");
        eventsCache = dbEvents.getData("/");
      }

      return eventsCache;
    };

    /**
     * Sets a event group to active.
     */
    service.setActiveEventGroup = function(groupId) {
      let dbSettings = profileManager.getJsonDbInProfile("/settings"),
        lastGroupId = false;

      try {
        lastGroupId = dbSettings.getData("/liveEvents/lastGroupId");

        // If lastGroupId and groupId match, we don't need to do anything. Otherwise set the new one.
        if (lastGroupId !== groupId) {
          dbSettings.push("/liveEvents/lastGroupId", groupId);
        }
      } catch (err) {
        logger.error(
          "There was an error setting a new active live event group."
        );
      }
    };

    /**
     * Grabs json of currently selected event group.
     */
    service.getActiveEventGroupJson = function() {
      let dbSettings = profileManager.getJsonDbInProfile("/settings"),
        lastGroupId = {};

      try {
        lastGroupId = dbSettings.getData("/liveEvents/lastGroupId");

        // If for whatever reason the events cache isnt ready, cache new events.
        if (eventsCache === false) {
          dbEvents = profileManager.getJsonDbInProfile("/live-events/events");
          eventsCache = dbEvents.getData("/");
        }

        return eventsCache[lastGroupId];
      } catch (err) {
        return {};
      }
    };

    /**
     * Adds or updates an event.
     * When adding an event it will increment the highest numbered event by 1 for the new id.
     */
    service.addOrUpdateEvent = function(event) {
      let eventId = event.id,
        dbSettings = profileManager.getJsonDbInProfile("/settings"),
        lastGroupId = dbSettings.getData("/liveEvents/lastGroupId"),
        dbEvents = profileManager.getJsonDbInProfile("/live-events/events");

      // See if we're editing an event or adding a new one.
      try {
        // We are editing an event if this passes. Replace the old event.
        let editEventTest = dbEvents.getData(
          "/" + lastGroupId + "/events/" + eventId
        );
        dbEvents.push("/" + lastGroupId + "/events/" + eventId, event);
        logger.info("Edited live event id:" + eventId);
      } catch (err) {
        console.log(err);
        // This is a new event, lets make a new one.
        let parsedGroups = Object.keys(dbEvents.getData("/")).map(x =>
            parseInt(x)
          ),
          sortedGroups = parsedGroups.sort(function(a, b) {
            return b - a;
          }),
          newId = parseInt(sortedGroups.slice(0, 1)) + 1;

        // We now have the next highest id in the array.
        event["id"] = newId;
        dbEvents.push("/" + lastGroupId + "/events/" + newId, event);
        logger.info("Added new live event id:" + newId);
      }

      // Update events cache.
      logger.info("Live events renderer cache updated.");
      eventsCache = dbEvents.getData("/");
    };

    /**
     * Removes a live event.
     */
    service.removeEvent = function(eventId) {
      let dbSettings = profileManager.getJsonDbInProfile("/settings"),
        lastGroupId = dbSettings.getData("/liveEvents/lastGroupId"),
        dbEvents = profileManager.getJsonDbInProfile("/live-events/events");

      try {
        dbEvents.delete("/" + lastGroupId + "/events/" + eventId);
        logger.debug("Deleted live event id: " + eventId);
      } catch (err) {
        logger.error(
          "There was an error while trying to delete a live event. Event Id: " +
            eventId
        );
      }

      // Update events cache.
      logger.info("Live events renderer cache updated.");
      eventsCache = dbEvents.getData("/");
    };

    /**
     * Get event type name from our EventTypes definitions.
     */
    service.getEventTypeName = function(type) {
      let eventType = EventType.getEvent(type);
      return eventType.name;
    };

    return service;
  });
})();
