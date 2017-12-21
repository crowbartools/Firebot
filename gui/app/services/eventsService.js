'use strict';

(function() {

    //This handles events
    const dataAccess = require('../../lib/common/data-access.js');
    const {ipcRenderer} = require('electron');

    angular
        .module('firebotApp')
        .factory('eventsService', function () {
            let service = {};
            let events = [];

            service.getEvents = function() {
                return events;
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
                    console.log(err);
                }
            };

            // Adds or Updates and event.
            service.addOrUpdateEvent = function(event, previousEvent) {
                let dbEvents = dataAccess.getJsonDbInUserData("/user-settings/live-events/events");

                if (previousEvent != null && previousEvent !== "" && previousEvent !== event.eventName) {
                    deleteEvent(previousEvent);
                }

                dbEvents.push("/" + event.eventName, event);

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
