"use strict";
const logger = require('../../../../logwrapper');
const eventManager = require("../../../../events/EventManager");

const EVENT_SOURCE_ID = "tipeeestream";
const EventId = {
    DONATION: "donation"
};

const eventSourceDefinition = {
    id: EVENT_SOURCE_ID,
    name: "TipeeeStream",
    description: "Donation/tip events from tipeeestream",
    events: [
        {
            id: EventId.DONATION,
            name: "Donation",
            description: "When someone donates to you via TipeeeStream.",
            cached: false,
            queued: true
        }
    ]
};

exports.registerEvents = () => {
    eventManager.registerEventSource(eventSourceDefinition);
};

exports.processTipeeeStreamEvent = (eventData) => {
    logger.debug("Tipeee event received", eventData);
    if (eventData === null) return;
    if (eventData.type === "donation") {
        let donoData = eventData.parameters;
        eventManager.triggerEvent(EVENT_SOURCE_ID, EventId.DONATION, {
            formattedDonationAmmount: eventData.formattedAmount,
            dononationAmount: donoData.amount,
            donationMessage: donoData.formattedMessage,
            from: donoData.username
        });
    }
};