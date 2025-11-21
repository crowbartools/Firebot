"use strict";
const logger = require('../../../../logwrapper');
const { EventManager } = require("../../../../events/event-manager");

const EVENT_SOURCE_ID = "tipeeestream";
const EventId = {
    DONATION: "donation",
    FOLLOW: "follow"
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
            manualMetadata: {
                from: "TipeeeStream",
                formattedDonationAmount: 5,
                donationAmount: 5,
                donationMessage: "Test message"
            },
            isIntegration: true,
            activityFeed: {
                icon: "fad fa-money-bill",
                getMessage: (eventData) => {
                    return `**${eventData.from}** donated **${eventData.formattedDonationAmount}**${eventData.donationMessage && !!eventData.donationMessage.length ? `: *${eventData.donationMessage}*` : ''}`;
                }
            }
        },
        {
            id: EventId.FOLLOW,
            name: "Follow",
            description: "When someone follows your Twitch channel (comes from TipeeeStream)",
            cacheMetaKey: "username",
            cached: true,
            manualMetadata: {
                username: "TipeeeStream"
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
    EventManager.registerEventSource(eventSourceDefinition);
};

exports.processTipeeeStreamEvent = (eventData) => {
    logger.debug("Tipeee event received", eventData);
    if (eventData === null) {
        return;
    }
    if (eventData.type === "donation") {
        const donoData = eventData.parameters;
        EventManager.triggerEvent(EVENT_SOURCE_ID, EventId.DONATION, {
            formattedDonationAmount: eventData.formattedAmount,
            donationAmount: donoData.amount,
            donationMessage: donoData.formattedMessage,
            from: donoData.username
        });
    } else if (eventData.type === "follow" && eventData.origin === "twitch") {
        EventManager.triggerEvent(
            EVENT_SOURCE_ID,
            EventId.FOLLOW,
            {
                username: eventData.parameters.username
            }
        );
    }
};