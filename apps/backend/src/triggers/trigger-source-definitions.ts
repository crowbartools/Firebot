import { TriggerSourceDefinition } from "firebot-types";

export const TRIGGER_SOURCE_DEFINITIONS: TriggerSourceDefinition[] = [
    {
        id: "twitch",
        name: "Twitch",
        description: "Events like Follow, Host, Subscribe and more from Twitch",
        events: [
            { id: "host", name: "Host", description: "When someone hosts your channel." },
            { id: "raid", name: "Raid", description: "When someone raids your channel." },
            { id: "follow", name: "Follow", description: "When someone follows your channel." },
            {
                id: "sub",
                name: "Sub",
                description: "When someone subscribes (or resubscribes) to your channel.",
            },
            {
                id: "prime-sub-upgraded",
                name: "Prime Sub Upgraded",
                description: "When someone upgrades to a paid sub from a Prime sub.",
            },
            {
                id: "subs-gifted",
                name: "Sub Gifted",
                description: "When someone gifts a sub to someone else in your channel.",
            },
            {
                id: "community-subs-gifted",
                name: "Community Subs Gifted",
                description: "When someone gifts random subs to the community of the channel.",
            },
            {
                id: "gift-sub-upgraded",
                name: "Gift Sub Upgraded",
                description: "When someone upgrades to a paid sub from a gift sub.",
            },
            {
                id: "cheer",
                name: "Cheer",
                description: "When someone cheers in your channel (uses bits).",
            },
            {
                id: "bits-badge-unlocked",
                name: "Bits Badge Unlocked",
                description: "When someone unlocks a new bits badge tier in your channel.",
            },
            {
                id: "viewer-arrived",
                name: "Viewer Arrived",
                description: "When a viewer first chats in your channel.",
            },
            {
                id: "chat-message",
                name: "Chat Message",
                description: "When someone chats in your channel.",
            },
            {
                id: "banned",
                name: "Viewer Banned",
                description: "When someone is banned in your channel.",
            },
            {
                id: "timeout",
                name: "Viewer Timeout",
                description: "When someone is timed out in your channel.",
            },
            {
                id: "channel-reward-redemption",
                name: "Channel Reward Redemption",
                description: "When someone redeems a custom channel reward.",
            },
            {
                id: "whisper",
                name: "Whisper",
                description: "When someone sends you a whisper.",
            },
        ],
    },
    {
        id: "firebot",
        name: "Firebot",
        description: "Various events that can happen within Firebot.",
        events: [
            {
                id: "chat-connected",
                name: "Twitch Connected",
                description: "When Firebot connects to Twitch.",
            },
            {
                id: "view-time-update",
                name: "View Time Update",
                description: "When a viewer's view time updates automatically.",
            },
            {
                id: "firebot-started",
                name: "Firebot Started",
                description: "When Firebot has started running.",
            },
            {
                id: "custom-variable-expired",
                name: "Custom Variable Expired",
                description: "When a custom variable expires.",
            },
            {
                id: "custom-variable-set",
                name: "Custom Variable Created",
                description: "When a custom variable gets created.",
            },
            {
                id: "highlight-message",
                name: "Chat Message Highlight",
                description: "When you select to highlight a message on your overlay.",
            },
            {
                id: "category-changed",
                name: "Category Changed",
                description: "When you change the stream category in the dashboard.",
            },
        ],
    },
    {
        id: "streamlabs",
        name: "Streamlabs",
        description: "Donation events from Streamlabs",
        events: [
            {
                id: "donation",
                name: "Donation",
                description: "When someone donates via Streamlabs.",
            },
            {
                id: "eldonation",
                name: "Extra Life Donation",
                description: "When someone donates to your Extra Life campaign.",
            },
            {
                id: "follow",
                name: "Follow",
                description: "When someone follows your channel (from Streamlabs).",
            },
        ],
    },
    {
        id: "streamelements",
        name: "StreamElements",
        description: "Donation events from StreamElements",
        events: [
            { id: "donation", name: "Donation", description: "When someone donates." },
            {
                id: "follow",
                name: "Follow",
                description: "When someone follows your channel (from StreamElements).",
            },
        ],
    },
    {
        id: "streamloots",
        name: "StreamLoots",
        description: "Purchase/Redemption events from StreamLoots",
        events: [
            {
                id: "purchase",
                name: "Chest Purchase",
                description: "When someone purchases or gifts chests.",
            },
            {
                id: "redemption",
                name: "Card Redemption",
                description: "When someone redeems a card.",
            },
        ],
    },
    {
        id: "tipeeestream",
        name: "TipeeeStream",
        description: "Donation/tip events from TipeeeStream",
        events: [
            {
                id: "donation",
                name: "Donation",
                description: "When someone donates to you via TipeeeStream.",
            },
            {
                id: "follow",
                name: "Follow",
                description: "When someone follows your channel (from TipeeeStream).",
            },
        ],
    },
];
