"use strict";

const Source = {
    FIREBOT: "firebot",
    CHAT: "chat",
    EXTRALIFE: "extralife"
};

const eventDefinitions = [
    {
        id: "INTERACTIVE_CONNECTED",
        name: "Interactive Connected",
        sources: [Source.FIREBOT],
        description: "Firebot connected to Mixer Interactive."
    },
    {
        id: "CHAT_CONNECTED",
        name: "Chat Connected",
        sources: [Source.FIREBOT],
        description: "Firebot connected to Mixer Chat."
    },
    {
        id: "POLL_STARTED",
        name: "Poll Started",
        sources: [Source.CHAT],
        description: "Poll started in Mixer Chat."
    },
    {
        id: "POLL_ENDED",
        name: "Poll Ended",
        sources: [Source.CHAT],
        description: "Poll ended in Mixer Chat."
    },
    {
        id: "CHAT_MESSAGE",
        name: "Chat Message",
        sources: [Source.CHAT],
        description: "Chat message recieved in Mixer Chat."
    },
    {
        id: "USER_JOINED_CHAT",
        name: "User Joined Chat",
        sources: [Source.CHAT],
        description: "User joined Mixer Chat."
    },
    {
        id: "USER_LEAVE_CHAT",
        name: "User Left Chat",
        sources: [Source.CHAT],
        description: "User left Mixer Chat."
    },
    {
        id: "MESSAGE_DELETED",
        name: "Message Deleted",
        sources: [Source.CHAT],
        description: "Message deleted in Mixer Chat."
    },
    {
        id: "MESSAGE_PURGED",
        name: "Messages Purged",
        sources: [Source.CHAT],
        description: "User's messages purged in Mixer Chat"
    },
    {
        id: "CHAT_CLEARED",
        name: "Chat Cleared",
        sources: [Source.CHAT],
        description: "Mixer Chat was cleared."
    },
    {
        id: "USER_BANNED",
        name: "User Banned",
        sources: [Source.CHAT],
        description: "User was banned from Mixer Chat."
    },
    {
        id: "EXTRALIFE_DONATION",
        name: "ExtraLife Donation",
        sources: [Source.EXTRALIFE],
        description: "User donated to your ExtraLife."
    },
    {
        id: "SKILL",
        name: "Skill",
        sources: [Source.CHAT],
        description: "When a user uses any Skill (Ie any Sticker, Effect, or Rally)"
    },
    {
        id: "SKILL_STICKER",
        name: "Skill - Sticker Only",
        sources: [Source.CHAT],
        description: "When a user specifically uses a Sticker."
    }
];

function getEvents(sourceType) {
    // filter events list to given triggerType
    let filteredEvents = eventDefinitions.filter(e => {
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
    filteredEvents.forEach(e => {
        eventsObject[e.id] = e.id;
    });
    return eventsObject;
}

function getEventByName(eventName) {
    let event = eventDefinitions.filter(e => e.name === eventName);
    if (event.length < 1) {
        return null;
    }
    return event[0];
}

function getEventById(eventId) {
    let event = eventDefinitions.filter(e => e.id === eventId);
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
    if (eventIdOrName === "No Event Selected") {
        return {
            id: "No Event Selected",
            name: "No Event Selected"
        };
    }

    let events = eventDefinitions.filter((e) => e.id === eventIdOrName || e.name === eventIdOrName);

    if (events.length < 1) {
        return null;
    }

    return events[0];
};
