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

    return service;
  });
})();
