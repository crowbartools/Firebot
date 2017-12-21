'use strict';

const Trigger = {
    CONSTELLATION: "constellation"
};

const eventDefinitions = [
    {
        id: "update",
        name: "Update",
        triggers: [Trigger.CONSTELLATION],
        description: "Channel stats are updated."
    },
    {
        id: "followed",
        name: "Follow",
        triggers: [Trigger.CONSTELLATION],
        description: "A user follows the channel."
    },
    {
        id: "hosted",
        name: "Host",
        triggers: [Trigger.CONSTELLATION],
        description: "A user hosts the channel."
    },
    {
        id: "subscribe",
        name: "Subscriber",
        triggers: [Trigger.CONSTELLATION],
        description: "Subs, Re-Subs, Shared Re-subs."
    }
];

function getEvents(triggerType) {
    // filter events list to given triggerType
    let filteredEvents = eventDefinitions.filter((e) => {
        if (triggerType != null) {
            return e.triggers.includes(triggerType);
        }
        return true;
    });
    return filteredEvents;
}

function generateEventObjects(triggerType) {
    let eventsObject = {};
    let filteredEvents = getEvents(triggerType);
    filteredEvents.forEach((e) => {
        eventsObject[e.id] = e.name;
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

function getTriggerTypesForEvent(eventName) {
    let event = getEventByName(eventName);
    if (event == null) {
        return null;
    }
    return event.triggerTypes;
}

function getDependenciesForEvent(eventName) {
    let event = getEventByName(eventName);
    if (event == null) {
        return null;
    }
    return event.dependencies;
}

// Generate 'Enum' objects for all events
let EventType = generateEventObjects();

//export types
exports.TriggerType = Trigger;
exports.EventType = EventType;

//export helper functions
exports.getEventDefinitions = getEvents;
exports.getTriggerTypesForEvent = getTriggerTypesForEvent;
exports.getEventByName = getEventByName;
exports.getDependenciesForEvent = getDependenciesForEvent;
exports.getEventById = getEventById;

exports.eventCanBeTriggered = function(eventName, triggerType) {
    let triggerTypes = getTriggerTypesForEvent(eventName);
    if (triggerTypes == null) return false;

    return triggerTypes.includes(triggerType);
};

exports.getEventDictionary = generateEventObjects;

exports.getAllEventTypes = function(triggerType) {
    // if triggerType is null, all events are returned
    let events = getEvents(triggerType);

    //map to just an array of names and return
    return events.map(e => e.name);
};

exports.getEvent = function(eventIdOrName) {
    let events = eventDefinitions.filter((e) => e.id === eventIdOrName || e.name === eventIdOrName);

    if (events.length < 1) {
        return null;
    }

    return events[0];
};
