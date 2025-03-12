"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("simulatedEventsCache", function() {

            /***
             * @type {Record<string, Record<string, unknown>>}
             */
            const simulatedEventProperties = {};

            const service = {};

            function getEventKey(sourceId, eventId) {
                return `${sourceId}:${eventId}`;
            }

            service.hasPreviouslySimulatedEvent = (sourceId, eventId) => {
                return simulatedEventProperties[getEventKey(sourceId, eventId)] != null;
            };

            service.getPreviouslySimulatedEventProperties = (sourceId, eventId) => {
                return simulatedEventProperties[getEventKey(sourceId, eventId)];
            };

            service.setSimulatedEventProperties = (sourceId, eventId, properties) => {
                simulatedEventProperties[getEventKey(sourceId, eventId)] = properties;
            };

            return service;
        });
})();
