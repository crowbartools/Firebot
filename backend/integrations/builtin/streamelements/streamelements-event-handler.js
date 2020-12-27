"use strict";

const logger = require("../../../logwrapper");

const eventManager = require("../../../events/EventManager");

const EVENT_SOURCE_ID = "streamelements";
const EventId = {
    DONATION: "donation",
    FOLLOW: "follow"
};

const eventSourceDefinition = {
    id: EVENT_SOURCE_ID,
    name: "StreamElements",
    description: "Donation events from StreamElements",
    events: [
        {
            id: EventId.DONATION,
            name: "Donation",
            description: "When someone donates.",
            cached: false
        },
        {
            id: EventId.FOLLOW,
            name: "Follow",
            description: "When someone follows your Twitch channel (comes from StreamElements)",
            cacheMetaKey: "username",
            cached: true
        }
    ]
};

exports.registerEvents = () => {
    eventManager.registerEventSource(eventSourceDefinition);
};

exports.processDonationEvent = (eventData) => {
    eventManager.triggerEvent(EVENT_SOURCE_ID, EventId.DONATION, {
        dononationAmount: eventData.amount,
        donationMessage: eventData.message,
        from: eventData.name
    });
};

exports.processFollowEvent = (eventData) => {
    eventManager.triggerEvent(EVENT_SOURCE_ID, EventId.FOLLOW, {
        username: eventData.displayName
    });
};