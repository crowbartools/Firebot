"use strict";

const eventManager = require("../../../../events/EventManager");

const EVENT_SOURCE_ID = "streamlabs";
const EventId = {
    DONATION: "donation",
    EXTRA_LIFE_DONATION: "eldonation",
    FOLLOW: "follow"
};

const eventSourceDefinition = {
    id: EVENT_SOURCE_ID,
    name: "Streamlabs",
    description: "Donation events from Streamlabs",
    events: [
        {
            id: EventId.DONATION,
            name: "Donation",
            description: "When someone donates to you via StreamLabs.",
            cached: false,
            queued: true
        },
        {
            id: EventId.EXTRA_LIFE_DONATION,
            name: "Extra Life Donation",
            description: "When someone donates to your Extra Life campaign.",
            cached: false,
            queued: true
        },
        {
            id: EventId.FOLLOW,
            name: "Follow",
            description: "When someone follows your Twitch channel (comes from StreamLabs)",
            cacheMetaKey: "username",
            cached: true
        }
    ]
};

exports.registerEvents = () => {
    eventManager.registerEventSource(eventSourceDefinition);
};

exports.processStreamLabsEvent = (eventData) => {
    if (eventData === null) return;
    if (eventData.type === "donation") {
        let donoData = eventData.message[0];
        eventManager.triggerEvent(EVENT_SOURCE_ID, EventId.DONATION, {
            formattedDonationAmount: donoData.formatted_amount,
            dononationAmount: donoData.amount,
            donationMessage: donoData.message,
            from: donoData.from
        });
    } else if (eventData.type === "eldonation") {
        let donoData = eventData.message[0];
        eventManager.triggerEvent(
            EVENT_SOURCE_ID,
            EventId.EXTRA_LIFE_DONATION,
            {
                formattedDonationAmount: donoData.formatted_amount,
                dononationAmount: donoData.amount,
                donationMessage: donoData.message,
                from: donoData.from
            }
        );
    } else if (eventData.type === "follow" && eventData.for === 'twitch_account') {
        for (const message of eventData.message) {
            eventManager.triggerEvent(
                EVENT_SOURCE_ID,
                EventId.FOLLOW,
                {
                    username: message.name,
                    userId: message.id
                }
            );
        }
    }
};

