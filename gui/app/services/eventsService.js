'use strict';

(function() {

    //This handles events
    const _ = require('underscore')._;
    const EventType = require('../../lib/live-events/EventType.js');
    const dataAccess = require('../../lib/common/data-access.js');
    const {ipcRenderer} = require('electron');

    angular
        .module('firebotApp')
        .factory('eventsService', function (logger) {
            let service = {};
            let events = [];

            // Get a list of events json obj based on a given category.
            service.getEvents = function(eventCategory) {
                // Convert user friendly name to event id.
                eventCategory = EventType.getEvent(eventCategory).id;

                // Start building a list and checking it twice.
                let eventsList = [],
                    event = [];
                Object.keys(events).forEach(k => {
                    event = events[k];
                    let effectCount = 0;

                    if (event.effects != null) {
                        Object.keys(event.effects).forEach(() => {
                            effectCount++;
                        });
                    }

                    event.effectCount = effectCount;

                    if (event.eventType === eventCategory) {
                        eventsList.push(event);
                    } else if (event.eventType == null && eventCategory === "No Event Selected") {
                        eventsList.push(event);
                    }
                });

                // Sort list and reverse it so that active events always come first.
                eventsList = _.sortBy(eventsList, 'active');

                // Return our new list.
                return eventsList;
            };

            // This will get all events categories that we have active events for.
            service.getCategories = function () {
                let eventCategories = [];

                Object.keys(events).forEach(k => {
                    let catName = "";
                    // Convert from event id to event name for user friendly ui.

                    let type = events[k].eventType;
                    if (type == null) {
                        catName = "No Event Selected";
                    } else {
                        catName = EventType.getEvent(type).name;
                    }

                    if (!eventCategories.includes(catName)) {
                        eventCategories.push(catName);
                    }
                });

                return eventCategories;
            };

            // Deletes events.
            function deleteEvent(eventName) {
                let dbEvents = dataAccess.getJsonDbInUserData("/user-settings/live-events/events");
                dbEvents.delete("/" + eventName);
            }

            // This will load up all saved events for the ui.
            service.loadEvents = function() {
                // Load up all custom made groups in each dropdown.
                let dbEvents = dataAccess.getJsonDbInUserData("/user-settings/live-events/events");
                try {
                    let rawEvents = dbEvents.getData('/');
                    if (rawEvents != null) {
                        events = rawEvents;
                    }
                } catch (err) {
                    logger.error(err);
                }
            };

            // Adds or Updates and event.
            service.addOrUpdateEvent = function(event, previousEvent) {
                let dbEvents = dataAccess.getJsonDbInUserData("/user-settings/live-events/events");

                if (previousEvent != null && previousEvent !== "" && previousEvent !== event.eventName) {
                    deleteEvent(previousEvent);
                }

                dbEvents.push("/" + event.eventName, event);

                // We can only have one active set of effects for each type, so lets turn the others off.
                if (event.active === true) {
                    let fullList = dbEvents.getData('/');
                    Object.keys(fullList).forEach(k => {
                        let newEvent = fullList[k];
                        if (newEvent.eventName !== event.eventName && newEvent.active === true && newEvent.eventType === event.eventType) {
                            dbEvents.push("/" + newEvent.eventName + "/active", false);
                        }
                    });
                }

                service.loadEvents();

                // Refresh the events cache.
                ipcRenderer.send('refreshEventCache');
            };

            // Removes and event and reloads the list.
            service.removeEvent = function(eventName) {

                deleteEvent(eventName);

                service.loadEvents();
            };

            return service;
        });
}());
