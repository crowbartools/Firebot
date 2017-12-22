'use strict';

const Source = {
    CONSTELLATION: "constellation"
};

const eventDefinitions = [
    {
        id: "UPDATE",
        name: "Update",
        sources: [Source.CONSTELLATION],
        description: "Channel stats are updated."
    },
    {
        id: "FOLLOWED",
        name: "Follow",
        sources: [Source.CONSTELLATION],
        description: "A user follows the channel."
    },
    {
        id: "HOSTED",
        name: "Host",
        sources: [Source.CONSTELLATION],
        description: "A user hosts the channel."
    },
    {
        id: "SUBSCRIBED",
        name: "Subscriber",
        triggers: [Source.CONSTELLATION],
        description: "Subs, Re-Subs, Shared Re-subs."
    }
];

function getEvents(sourceType) {
    // filter events list to given triggerType
    let filteredEvents = eventDefinitions.filter((e) => {
        if (sourceType != null) {
            return e.sources.includes(sourceType);
        }
        return true;
    });
    return filteredEvents;
}

function generateEventObjects(sourceType) {
    let eventsObject = {};
    let filteredEvents = getEvents(sourceType);
    filteredEvents.forEach((e) => {
        eventsObject[e.id] = e.id;
    });
    return eventsObject;
}

function getEventByName(eventName) {
    let event = eventDefinitions.filter((e) => e.name === eventName);
    if (event.length < 1) {
        return null;
    }
    return event[0];
}

function getEventById(eventId) {
    let event = eventDefinitions.filter((e) => e.id === eventId);
    if (event.length < 1) {
        return null;
    }
    return event[0];
}

function getSourceTypesForEvent(eventId) {
    let event = getEventById(eventId);
    if (event == null) {
        return null;
    }
    return event.sources;
}

function getDependenciesForEvent(eventId) {
    let event = getEventById(eventId);
    if (event == null) {
        return null;
    }
    return event.dependencies;
}

// Generate 'Enum' objects for all events
let EventType = generateEventObjects();

//export types
exports.EventSourceType = Source;
exports.EventType = EventType;
exports.LiveEvent = function(type, source, metadata) {
    this.type = type;
    this.source = source;
    this.metadata = metadata;
};

//export helper functions
exports.getEventDefinitions = getEvents;
exports.getSourceTypesForEvent = getSourceTypesForEvent;
exports.getEventByName = getEventByName;
exports.getDependenciesForEvent = getDependenciesForEvent;
exports.getEventById = getEventById;

exports.eventCanBeTriggered = function(eventId, sourceType) {
    let sourceTypes = getSourceTypesForEvent(eventId);
    if (sourceTypes == null) return false;

    return sourceTypes.includes(sourceType);
};

exports.getAllEventTypes = function(sourceType) {
    // if triggerType is null, all events are returned
    let events = getEvents(sourceType);

    //map to just an array of ids and return
    return events.map(e => e.id);
};

exports.getEvent = function(eventIdOrName) {
    let events = eventDefinitions.filter((e) => e.id === eventIdOrName || e.name === eventIdOrName);

    if (events.length < 1) {
        return null;
    }

    return events[0];
};
