"use strict";

module.exports = {
    id: "twitch",
    name: "Twitch",
    description: "Events like Follow, Host, Subscribe and more from Twitch",
    events: [
        {
            id: "host",
            name: "Host",
            description: "When someone hosts your channel.",
            cached: true,
            cacheMetaKey: "username",
            manualMetadata: {
                username: "Firebot",
                viewerCount: 5
            }
        },
        {
            id: "raid",
            name: "Raid",
            description: "When someone raids your channel.",
            cached: true,
            cacheMetaKey: "username",
            manualMetadata: {
                username: "Firebot",
                viewerCount: 5
            }
        },
        {
            id: "follow",
            name: "Follow",
            description: "When someone follows your channel.",
            cached: true,
            cacheMetaKey: "username",
            manualMetadata: {
                username: "Firebot",
                userId: 0
            }
        },
        {
            id: "sub",
            name: "Sub",
            description: "When someone initially subscribes to your channel.",
            cached: false,
            manualMetadata: {
                username: "Firebot",
                totalMonths: 0
            }
        },
        {
            id: "subs-gifted",
            name: "Subs Gifted",
            description: "When someone gifts subs in your channel.",
            cached: false,
            manualMetadata: {
                username: "Firebot",
                totalMonths: 0
            }
        }
    ]
};