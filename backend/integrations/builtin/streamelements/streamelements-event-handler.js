"use strict";

const logger = require("../../../logwrapper");

const eventManager = require("../../../events/EventManager");

const EVENT_SOURCE_ID = "streamelements";
const EventId = {
    DONATION: "donation"
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
        }
    ]
};

exports.registerEvents = () => {
    eventManager.registerEventSource(eventSourceDefinition);
};

exports.processStreamElementsEvent = (eventData) => {

    logger.debug("Received StreamElements event:", eventData);

    eventManager.triggerEvent(EVENT_SOURCE_ID, EventId.DONATION, {
        dononationAmount: eventData.amount,
        donationMessage: eventData.message,
        from: eventData.name
    });
};