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
            manualMetadata: {
                from: "StreamElements",
                donationAmount: 5,
                formattedDonationAmount: 5,
                donationMessage: "Test message"
            },
            isIntegration: true,
            activityFeed: {
                icon: "fad fa-money-bill",
                getMessage: (eventData) => {
                    return `**${eventData.from}** donated **$${eventData.donationAmount}**${eventData.donationMessage && !!eventData.donationMessage.length ? `: *${eventData.donationMessage}*` : ''}`;
                }
            }
        },
        {
            id: EventId.FOLLOW,
            name: "Follow",
            description: "When someone follows your Twitch channel (comes from StreamElements)",
            cacheMetaKey: "username",
            cached: true,
            manualMetadata: {
                username: "StreamElements"
            },
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

const currencies = new Map([
    ["USD", "$"],
    ["AUD", "$"],
    ["CAD", "$"],
    ["HKD", "$"],
    ["MXN", "$"],
    ["NZD", "$"],
    ["SGD", "$"],
    ["EUR", "€"],
    ["GBP", "£"],
    ["BRL", "R$"],
    ["CHF", "CHF"],
    ["DKK", "kr"],
    ["NOK", "kr"],
    ["SEK", "kr"],
    ["HUF", "Ft"],
    ["ILS", "₪"],
    ["INR", "₹"],
    ["JPY", "¥"],
    ["MYR", "RM"],
    ["PHP", "₱"],
    ["PLN", "zł"],
    ["UAH", "₴"],
    ["RUB", "₽"],
    ["TWD", "NT$"],
    ["THB", "฿"],
    ["TRY", "₺"]
]);

exports.processDonationEvent = (eventData) => {
    eventManager.triggerEvent(EVENT_SOURCE_ID, EventId.DONATION, {
        donationAmount: eventData.amount,
        formattedDonationAmount: currencies.get(eventData.currency) + eventData.amount,
        donationMessage: eventData.message,
        from: eventData.username
    });
};

exports.processFollowEvent = (eventData) => {
    eventManager.triggerEvent(EVENT_SOURCE_ID, EventId.FOLLOW, {
        username: eventData.displayName
    });
};
