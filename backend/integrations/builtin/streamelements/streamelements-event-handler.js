"use strict";

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
            cached: false,
            isIntegration: true,
            activityFeed: {
                icon: "fad fa-money-bill",
                getMessage: (eventData) => {
                    return `**${eventData.from}** donated **$${eventData.dononationAmount}**${eventData.donationMessage && !!eventData.donationMessage.length ? `: *${eventData.donationMessage}*` : ''}`;
                }
            }
        },
        {
            id: EventId.FOLLOW,
            name: "Follow",
            description: "When someone follows your Twitch channel (comes from StreamElements)",
            cacheMetaKey: "username",
            cached: true,
            isIntegration: true,
            activityFeed: {
                icon: "fas fa-heart",
                getMessage: (eventData) => {
                    return `**${eventData.username}** followed`;
                }
            }
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