"use strict";

/**
 * The firebot event source
 */
const firebotEventSource = {
    id: "firebot",
    name: "Firebot",
    description: "Various events that can happen within Firebot.",
    events: [
        {
            id: "chat-connected",
            name: "Chat Connected",
            description: "When Firebot connects to Twitch Chat.",
            cached: false,
            manualMetadata: {
                username: "Firebot"
            }
        },
        {
            id: "view-time-update",
            name: "View Time Update",
            description: "When a viewer's view time updates automatically.",
            cached: false,
            manualMetadata: {
                previousViewTime: 1,
                newViewTime: 2
            }
        },
        {
            id: "firebot-started",
            name: "Firebot Started",
            description: "When Firebot has started running.",
            cached: false
        },
        {
            id: "custom-variable-expired",
            name: "Custom Variable Expired",
            description: "When a custom variable expires",
            cached: false
        },
        {
            id: "custom-variable-set",
            name: "Custom Variable Created",
            description: "When a custom variable gets created",
            cached: false
        }
    ]
};

module.exports = firebotEventSource;
