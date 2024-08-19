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
            name: "Twitch Connected",
            description: "When Firebot connects to Twitch.",
            cached: false,
            activityFeed: {
                icon: "fad fa-plug",
                getMessage: () => {
                    return `Connected to Twitch`;
                }
            }
        },
        {
            id: "overlay-connected",
            name: "Overlay Connected",
            description: "When a Firebot overlay is connected.",
            cached: false,
            manualMetadata: {
                instanceName: "Default"
            },
            activityFeed: {
                icon: "fad fa-tv-alt",
                getMessage: (eventData) => {
                    return `**${eventData.instanceName}** overlay connected`;
                }
            }
        },
        {
            id: "view-time-update",
            name: "View Time Update",
            description: "When a viewer's view time updates automatically.",
            cached: false,
            manualMetadata: {
                username: "Firebot",
                previousViewTime: 1,
                newViewTime: 2
            }
        },
        {
            id: "currency-update",
            name: "Currency Update",
            description: "When a viewer's currency changes.",
            cached: false,
            manualMetadata: {
                username: "Firebot",
                currencyName: "Coins",
                previousCurrencyAmount: 1,
                newCurrencyAmount: 2
            }
        },
        {
            id: "viewer-created",
            name: "Viewer Created",
            description: "When a viewer is first saved in the Viewer Database",
            cached: false,
            manualMetadata: {
                username: "Firebot"
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
        },
        {
            id: "highlight-message",
            name: "Chat Message Spotlight",
            description: "When you choose to spotlight a message, like by displaying on an overlay.",
            cached: false,
            manualMetadata: {
                username: "Firebot",
                messageText: "Test message"
            }
        },
        {
            id: "category-changed",
            name: "Category Changed",
            description: "When you change the stream category in the Firebot Dashboard.",
            cached: false,
            manualMetadata: {
                category: "Just Chatting"
            }
        },
        {
            id: "effect-queue-cleared",
            name: "Effect Queue Cleared",
            description: "When an effect queue finishes running and is cleared.",
            cached: false,
            manualMetadata: {
                queueName: "Just Chatting"
            }
        },
        {
            id: "before-firebot-closed",
            name: "Before Firebot Closed",
            description: "Just before firebot is closed",
            cached: false
        },
        {
            id: "viewer-rank-updated",
            name: "Viewer Rank Updated",
            description: "When a viewer's rank is updated within a rank ladder.",
            cached: false,
            manualMetadata: {
                username: "Firebot",
                rankLadderName: "Rank Ladder",
                newRankName: "New Rank",
                previousRankName: "Previous Rank",
                isPromotion: true,
                isDemotion: false
            }
        },
        {
            id: "viewer-metadata-updated",
            name: "Viewer Metadata Updated",
            description: "When a viewer's metadata value is updated.",
            cached: false,
            manualMetadata: {
                username: "Firebot",
                metadataKey: "testKey",
                metadataValue: "testValue"
            }
        }
    ]
};

module.exports = firebotEventSource;
