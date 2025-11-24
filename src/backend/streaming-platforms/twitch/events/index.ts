/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import escape from "escape-html";

import type { EventSource } from "../../../../types/events";

import * as ad from "./ad";
import * as announcement from "./announcement";
import * as bits from "./bits";
import * as charity from "./charity";
import * as chat from "./chat";
import * as chatMessage from "./chat-message";
import * as chatModeChanged from "./chat-mode-changed";
import * as follow from "./follow";
import * as giftSub from "./gift-sub";
import * as goal from "./goal";
import * as hypeTrain from "./hype-train";
import * as poll from "./poll";
import * as prediction from "./prediction";
import * as raid from "./raid";
import * as rewardRedemption from "./reward-redemption";
import * as shoutout from "./shoutout";
import * as stream from "./stream";
import * as sub from "./sub";
import * as viewerArrived from "./viewer-arrived";
import * as viewerBanned from "./viewer-banned";
import * as viewerTimeout from "./viewer-timeout";
import * as whisper from "./whisper";

export const TwitchEventHandlers = {
    ad,
    announcement,
    bits,
    charity,
    chat,
    chatMessage,
    chatModeChanged,
    follow,
    giftSub,
    goal,
    hypeTrain,
    poll,
    prediction,
    raid,
    rewardRedemption,
    shoutout,
    stream,
    sub,
    viewerArrived,
    viewerBanned,
    viewerTimeout,
    whisper
};

export const TwitchEventSource: EventSource = {
    id: "twitch",
    name: "Twitch",
    description: "Events like Follow, Subscribe, and more from Twitch",
    events: [
        {
            id: "raid",
            name: "Incoming Raid",
            description: "When someone raids your channel.",
            cached: true,
            cacheMetaKey: "username",
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                viewerCount: 5
            },
            activityFeed: {
                icon: "fad fa-inbox-in",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }** raided with **${eventData.viewerCount}** viewer(s)`;
                }
            }
        },
        {
            id: "outgoing-raid-started",
            name: "Outgoing Raid Started",
            description: "When you or a moderator starts an outgoing raid to another channel.",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userId: "",
                userDisplayName: "Firebot",
                raidTargetUsername: "user",
                raidTargetUserId: "",
                raidTargetUserDisplayName: "User",
                moderator: "BestMod",
                viewerCount: 5
            },
            activityFeed: {
                icon: "fad fa-inbox-out",
                getMessage: (eventData) => {
                    return `**${eventData.moderator}** started raid to user **${eventData.raidTargetUserDisplayName}** with **${
                        eventData.viewerCount
                    }** viewer(s)`;
                }
            }
        },
        {
            id: "outgoing-raid-canceled",
            name: "Outgoing Raid Canceled",
            description: "When you or a moderator cancels an outgoing raid to another channel.",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userId: "",
                userDisplayName: "Firebot",
                raidTargetUsername: "user",
                raidTargetUserId: "",
                raidTargetUserDisplayName: "User",
                moderator: "BestMod"
            },
            activityFeed: {
                icon: "fad fa-undo",
                getMessage: (eventData) => {
                    return `**${eventData.moderator}** canceled raid to user **${eventData.raidTargetUserDisplayName}**`;
                }
            }
        },
        {
            id: "raid-sent-off",
            name: "Outgoing Raid Complete",
            description: "When your outgoing raid is completed.",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userId: "",
                userDisplayName: "Firebot",
                raidTargetUsername: "user",
                raidTargetUserId: "",
                raidTargetUserDisplayName: "User",
                viewerCount: 5
            },
            activityFeed: {
                icon: "fad fa-inbox-out",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }** raiding user **${eventData.raidTargetUserDisplayName}** with **${
                        eventData.viewerCount
                    }** viewer(s)`;
                }
            }
        },
        {
            id: "follow",
            name: "Follow",
            description: "When someone follows your channel.",
            cached: true,
            cacheMetaKey: "username",
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: ""
            },
            activityFeed: {
                icon: "fas fa-heart",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }** followed`;
                }
            }
        },
        {
            id: "sub",
            name: "Sub",
            description: "When someone subscribes (or resubscribes) to your channel.",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                isPrime: false,
                isResub: false,
                subPlan: {
                    type: "enum",
                    options: {
                        Prime: "Prime",
                        1000: "Tier 1",
                        2000: "Tier 2",
                        3000: "Tier 3"
                    },
                    value: "1000"
                },
                subMessage: "Test message",
                totalMonths: 10,
                streak: 8
            },
            activityFeed: {
                icon: "fas fa-star",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""}** ${
                        eventData.isResub ? "resubscribed" : "subscribed"
                    } for **${eventData.totalMonths} month(s)** ${
                        eventData.subPlan === "Prime"
                            ? "with **Twitch Prime**"
                            : `at **Tier ${eventData.subPlan.replace("000", "")}**`
                    }`;
                }
            }
        },
        {
            id: "prime-sub-upgraded",
            name: "Prime Sub Upgraded",
            description: "When someone upgrades to a paid sub from a Prime sub.",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                subPlan: {
                    type: "enum",
                    options: {
                        1000: "Tier 1",
                        2000: "Tier 2",
                        3000: "Tier 3"
                    },
                    value: "1000"
                }
            },
            activityFeed: {
                icon: "fas fa-star",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }** upgraded their Prime sub at **Tier ${eventData.subPlan.replace("000", "")}!**`;
                }
            }
        },
        {
            id: "subs-gifted",
            name: "Sub Gifted",
            description: "When someone gifts a sub to someone else in your channel.",
            cached: false,
            manualMetadata: {
                gifterUsername: "Firebot",
                isAnonymous: false,
                subPlan: {
                    type: "enum",
                    options: {
                        1000: "Tier 1",
                        2000: "Tier 2",
                        3000: "Tier 3"
                    },
                    value: "1000"
                },
                giftDuration: 1,
                gifteeUsername: "MageEnclave",
                lifetimeGiftCount: 1
            },
            activityFeed: {
                icon: "fad fa-gift",
                getMessage: (eventData) => {
                    return `**${eventData.isAnonymous ? "An Anonymous Gifter" : eventData.gifterUsername}** gifted a ${
                        eventData.giftDuration > 1 ? ` **${eventData.giftDuration} month** ` : ""
                    } **Tier ${eventData.subPlan.replace("000", "")}** sub to **${
                        eventData.gifteeUsername
                    }**`;
                }
            }
        },
        {
            id: "community-subs-gifted",
            name: "Community Subs Gifted",
            description: "When someone gifts random subs to the community of the channel",
            cached: false,
            manualMetadata: {
                gifterUsername: "Firebot",
                isAnonymous: false,
                subCount: 5,
                subPlan: {
                    type: "enum",
                    options: {
                        1000: "Tier 1",
                        2000: "Tier 2",
                        3000: "Tier 3"
                    },
                    value: "1000"
                },
                giftReceivers: {
                    type: "gift-receivers-list",
                    value: [
                        { gifteeUsername: "User1" },
                        { gifteeUsername: "User2" },
                        { gifteeUsername: "User3" },
                        { gifteeUsername: "User4" },
                        { gifteeUsername: "User5" }
                    ]
                },
                lifetimeGiftCount: 5
            },
            activityFeed: {
                icon: "fad fa-gifts",
                getMessage: (eventData) => {
                    return `**${eventData.isAnonymous ? "An Anonymous Gifter" : eventData.gifterUsername}** gifted **${
                        eventData.subCount
                    } Tier ${eventData.subPlan.replace("000", "")}** sub${
                        eventData.subCount > 1 ? "s" : ""
                    } to the community`;
                }
            }
        },
        {
            id: "gift-sub-upgraded",
            name: "Gift Sub Upgraded",
            description: "When someone upgrades to a paid sub from a gift sub.",
            cached: false,
            manualMetadata: {
                username: "cavemobster",
                userDisplayName: "CaveMobster",
                userId: "",
                gifteeUsername: "CaveMobster",
                gifterUsername: "Firebot",
                subPlan: {
                    type: "enum",
                    options: {
                        1000: "Tier 1",
                        2000: "Tier 2",
                        3000: "Tier 3"
                    },
                    value: "1000"
                }
            },
            activityFeed: {
                icon: "fas fa-star",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }** upgraded their gift sub at **Tier ${eventData.subPlan.replace("000", "")}!**`;
                }
            }
        },
        {
            id: "cheer",
            name: "Cheer",
            description: "When someone cheers in your channel (uses bits).",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                isAnonymous: false,
                bits: 100,
                totalBits: 1200,
                cheerMessage: "cheer100 Test message"
            },
            activityFeed: {
                icon: "fad fa-diamond",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }** cheered **${eventData.bits}** bits. They have cheered a total of **${
                        eventData.totalBits
                    }** in the channel.`;
                }
            }
        },
        {
            id: "bits-badge-unlocked",
            name: "Bits Badge Unlocked",
            description: "When someone unlocks a new bits badge tier in your channel.",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                message: "Test message",
                badgeTier: {
                    type: "enum",
                    options: {
                        1: "1",
                        100: "100",
                        1000: "1k",
                        5000: "5k",
                        10000: "10k",
                        25000: "25k",
                        50000: "50k",
                        75000: "75k",
                        100000: "100k",
                        200000: "200k",
                        300000: "300k",
                        400000: "400k",
                        500000: "500k",
                        600000: "600k",
                        700000: "700k",
                        800000: "800k",
                        900000: "900k",
                        1000000: "1M",
                        1250000: "1.25M",
                        1500000: "1.5M",
                        1750000: "1.75M",
                        2000000: "2M",
                        2500000: "2.5M",
                        3000000: "3M",
                        3500000: "3.5M",
                        4000000: "4M",
                        4500000: "4.5M",
                        5000000: "5M"
                    },
                    value: "1000"
                }
            },
            activityFeed: {
                icon: "fad fa-diamond",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }** unlocked the **${eventData.badgeTier}** bits badge in your channel!`;
                }
            }
        },
        {
            id: "bits-powerup-message-effect",
            name: "Power-Up: Message Effects",
            description: "When a viewer uses the \"Message Effects\" Power-Up in your channel.",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                bits: 30,
                totalBits: 1200,
                cheerMessage: "Test Message"
            },
            activityFeed: {
                icon: "fad fa-diamond",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""
                    }** used a Message Effects Power-Up for **${eventData.bits}** bits`;
                }
            }
        },
        {
            id: "bits-powerup-celebration",
            name: "Power-up: On-Screen Celebration",
            description: "When a viewer uses the \"On-Screen Celebration\" Power-Up in your channel.",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                bits: 50,
                totalBits: 1200
            },
            activityFeed: {
                icon: "fad fa-diamond",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""
                    }** used a Celebration Power-Up for **${eventData.bits}** bits`;
                }
            }
        },
        {
            id: "bits-powerup-gigantified-emote",
            name: "Power-up: Gigantify an Emote",
            description: "When a viewer uses the \"Gigantify an Emote\" Power-Up in your channel.",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                bits: 20,
                totalBits: 1200,
                cheerMessage: "Test Message",
                emoteName: "PogChamp",
                emoteUrl: "https://static-cdn.jtvnw.net/emoticons/v2/305954156/default/dark/3.0"
            },
            activityFeed: {
                icon: "fad fa-diamond",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""
                    }** gigantified the **${eventData.emoteName}** emote for **${eventData.bits}** bits`;
                }
            }
        },
        {
            id: "viewer-arrived",
            name: "Viewer Arrived",
            description: "When a viewer initially chats in any given stream.",
            cached: true,
            cacheMetaKey: "username",
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: ""
            },
            activityFeed: {
                icon: "fad fa-house-return",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }** arrived`;
                }
            }
        },
        {
            id: "chat-cleared",
            name: "Chat Cleared",
            description: "When chat is cleared in your channel",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userId: ""
            }
        },
        {
            id: "chat-message",
            name: "Chat Message",
            description: "When someone chats in your channel",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                messageText: "Test message"
            }
        },
        {
            id: "chat-message-deleted",
            name: "Chat Message Deleted",
            description: "When a chat message is deleted in your channel",
            cached: false,
            manualMetadata: {
                username: "firebot",
                messageText: "Test message"
            }
        },
        {
            id: "first-time-chat",
            name: "First Time Chat",
            description: "When someone chats in your channel for the very first time",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                messageText: "Test message"
            },
            activityFeed: {
                icon: "fad fa-sparkles",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }** has chatted in your channel for the very first time`;
                }
            }
        },
        {
            id: "announcement",
            name: "Announcement",
            description: "When you or a mod sends an announcement in your channel",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                messageText: "Test announcement"
            }
        },
        {
            id: "banned",
            name: "Viewer Banned",
            description: "When someone is banned in your channel",
            cached: false,
            manualMetadata: {
                username: "cavemobster",
                userDisplayName: "CaveMobster",
                userId: "",
                moderator: "Firebot",
                modReason: "They were extra naughty"
            },
            activityFeed: {
                icon: "fad fa-gavel",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    let message = `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }** was banned by **${eventData.moderator}**`;

                    if (eventData.modReason) {
                        message = `${message}. Reason: **${escape(eventData.modReason)}**`;
                    }
                    return message;
                }
            }
        },
        {
            id: "unbanned",
            name: "Viewer Unbanned",
            description: "When someone is unbanned in your channel",
            cached: false,
            manualMetadata: {
                username: "cavemobster",
                userDisplayName: "CaveMobster",
                userId: "",
                moderator: "Firebot"
            },
            activityFeed: {
                icon: "fad fa-gavel",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }** was unbanned by **${eventData.moderator}**`;
                }
            }
        },
        {
            id: "timeout",
            name: "Viewer Timeout",
            description: "When someone is timed out in your channel",
            cached: false,
            manualMetadata: {
                username: "alca",
                userDisplayName: "Alca",
                userId: "",
                timeoutDuration: "1",
                moderator: "Firebot",
                modReason: "They were naughty"
            },
            activityFeed: {
                icon: "fad fa-stopwatch",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    let message = `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }** was timed out for **${eventData.timeoutDuration} sec(s)** by ${eventData.moderator}`;

                    if (eventData.modReason) {
                        message = `${message}. Reason: **${escape(eventData.modReason)}**`;
                    }
                    return message;
                }
            }
        },
        {
            id: "channel-reward-redemption",
            name: "Channel Reward Redemption",
            description: "When someone redeems a CUSTOM channel reward",
            cached: true,
            cacheMetaKey: "username",
            cacheTtlInSecs: 1,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                rewardName: "Test Reward",
                rewardImage: "https://static-cdn.jtvnw.net/automatic-reward-images/highlight-1.png",
                rewardCost: 200,
                messageText: "Test message"
            },
            activityFeed: {
                icon: "fad fa-circle",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }** redeemed **${eventData.rewardName}**${
                        eventData.messageText && !!eventData.messageText.length ? `: *${escape(eventData.messageText)}*` : ""
                    }`;
                },
                excludeFromChatFeed: true
            }
        },
        {
            id: "channel-reward-redemption-fulfilled",
            name: "Channel Reward Redemption Approved",
            description: "When a CUSTOM channel reward redemption is Completed/Approved",
            cached: false,
            cacheMetaKey: "username",
            cacheTtlInSecs: 1,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                rewardName: "Test Reward",
                rewardImage: "https://static-cdn.jtvnw.net/automatic-reward-images/highlight-1.png",
                rewardCost: 200,
                messageText: "Test message"
            },
            activityFeed: {
                icon: "fad fa-circle",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }**'s redemption of **${eventData.rewardName}** was approved. ${
                        eventData.messageText && !!eventData.messageText.length ? `*${escape(eventData.messageText)}*` : ""
                    }`;
                }
            }
        },
        {
            id: "channel-reward-redemption-canceled",
            name: "Channel Reward Redemption Rejected",
            description: "When a CUSTOM channel reward redemption is Rejected/Refunded",
            cached: false,
            cacheMetaKey: "username",
            cacheTtlInSecs: 1,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                rewardName: "Test Reward",
                rewardImage: "https://static-cdn.jtvnw.net/automatic-reward-images/highlight-1.png",
                rewardCost: 200,
                messageText: "Test message"
            },
            activityFeed: {
                icon: "fad fa-circle",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }**'s redemption of **${eventData.rewardName}** was rejected. ${
                        eventData.messageText && !!eventData.messageText.length ? `*${escape(eventData.messageText)}*` : ""
                    }`;
                }
            }
        },
        {
            id: "channel-reward-redemption-single-message-bypass-sub-mode",
            name: "Channel Reward Redemption: Send a Message in Sub-Only Mode",
            description: "When someone redeems \"Send a Message in Sub-Only Mode\" to post a message in your channel",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                rewardCost: 200,
                messageText: "Test message",
                rewardDescription: "Send a Message in Sub-Only Mode"
            },
            activityFeed: {
                icon: "fad fa-arrow-right",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    const message = `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }** redeemed **Send a Message in Sub-Only Mode**`;
                    return message;
                }
            }
        },
        {
            id: "channel-reward-redemption-send-highlighted-message",
            name: "Channel Reward Redemption: Highlight My Message",
            description: "When someone redeems \"Highlight My Message\" in your channel",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                rewardCost: 200,
                messageText: "Test message",
                rewardDescription: "Highlight My Message"
            },
            activityFeed: {
                icon: "fad fa-highlighter",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    const message = `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }** redeemed **Highlight My Message**`;
                    return message;
                },
                excludeFromChatFeed: true
            }
        },
        {
            id: "channel-reward-redemption-random-sub-emote-unlock",
            name: "Channel Reward Redemption: Unlock a Random Sub Emote",
            description: "When someone redeems \"Unlock a Random Sub Emote\" to unlock an emote in your channel",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                rewardCost: 200,
                emoteName: "PogChamp",
                emoteUrl: "https://static-cdn.jtvnw.net/emoticons/v2/305954156/default/dark/3.0",
                rewardDescription: "Unlock a Random Sub Emote"
            },
            activityFeed: {
                icon: "fad fa-images",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    const message = `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }** redeemed **Unlock a Random Sub Emote**`;
                    return message;
                }
            }
        },
        {
            id: "channel-reward-redemption-chosen-sub-emote-unlock",
            name: "Channel Reward Redemption: Choose an Emote to Unlock",
            description: "When someone redeems \"Choose an Emote to Unlock\" to unlock an emote in your channel",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                rewardCost: 200,
                emoteName: "PogChamp",
                emoteUrl: "https://static-cdn.jtvnw.net/emoticons/v2/305954156/default/dark/3.0",
                rewardDescription: "Choose an Emote to Unlock"
            },
            activityFeed: {
                icon: "fad fa-images",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    const message = `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }** redeemed **Choose an Emote to Unlock**`;
                    return message;
                }
            }
        },
        {
            id: "channel-reward-redemption-chosen-modified-sub-emote-unlock",
            name: "Channel Reward Redemption: Modify a Single Emote",
            description: "When someone redeems \"Modify a Single Emote\" to modify and unlock an emote in your channel",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                rewardCost: 200,
                emoteName: "PogChamp",
                emoteUrl: "https://static-cdn.jtvnw.net/emoticons/v2/305954156/default/dark/3.0",
                rewardDescription: "Modify a Single Emote"
            },
            activityFeed: {
                icon: "fad fa-images",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    const message = `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }** redeemed **Modify a Single Emote**`;
                    return message;
                }
            }
        },
        {
            id: "whisper",
            name: "Whisper",
            description: "When someone sends you or your bot account a whisper.",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                message: "Test whisper",
                sentTo: {
                    type: "enum",
                    options: {
                        streamer: "Streamer",
                        bot: "Bot"
                    },
                    value: "streamer"
                }
            },
            activityFeed: {
                icon: "fad fa-comment-alt",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }** sent your **${eventData.sentTo}** account the following whisper: ${escape(eventData.message)}`;
                }
            }
        },
        {
            id: "chat-mode-changed",
            name: "Chat Mode Changed",
            description: "When the chat mode settings have been updated by a moderator.",
            cached: false,
            manualMetadata: {
                chatMode: {
                    type: "enum",
                    options: {
                        emoteonly: "Emote Only",
                        subscribers: "Subscribers Only",
                        followers: "Followers",
                        slow: "Slow",
                        uniquechat: "Unique Chat"
                    },
                    value: "emoteonly"
                },
                chatModeState: {
                    type: "enum",
                    options: {
                        enabled: "Enabled",
                        disabled: "Disabled"
                    },
                    value: "enabled"
                },
                moderator: "Firebot",
                duration: "30"
            },
            activityFeed: {
                icon: "fad fa-comment-alt",
                getMessage: (eventData) => {
                    return `**${eventData.moderator}** has set the chat mode to **${eventData.chatMode}**`;
                }
            }
        },
        {
            id: "channel-poll-begin",
            name: "Channel Poll Started",
            description: "When a channel poll begins on your channel.",
            cached: false,
            manualMetadata: {
                choices: {
                    options: { hideVotes: true },
                    type: "poll-choice-list",
                    value: [
                        { id: "c0113c14-144e-475c-9647-a65f9177665d", title: "Test Choice 1" },
                        { id: "6d86797a-d88a-4fc2-b4f6-1895afdc503e", title: "Test Choice 2" },
                        { id: "791bc06c-c4d5-4c74-b950-8596c04dbb0d", title: "Test Choice 3" }
                    ] },
                title: "Test Poll Name"
            },
            activityFeed: {
                icon: "fad fa-poll-h",
                getMessage: (eventData) => {
                    return `Channel poll **${eventData.title}** has begun`;
                }
            }
        },
        {
            id: "channel-poll-progress",
            name: "Channel Poll Progress",
            description: "When a channel poll progresses on your channel.",
            cached: false,
            manualMetadata: {
                choices: {
                    type: "poll-choice-list",
                    value: [
                        { id: "c0113c14-144e-475c-9647-a65f9177665d", title: "Test Choice 1", totalVotes: 120, channelPointsVotes: 60 },
                        { id: "6d86797a-d88a-4fc2-b4f6-1895afdc503e", title: "Test Choice 2", totalVotes: 140, channelPointsVotes: 40 },
                        { id: "791bc06c-c4d5-4c74-b950-8596c04dbb0d", title: "Test Choice 3", totalVotes: 80, channelPointsVotes: 70 }
                    ] },
                title: "Test Poll Name",
                winningChoiceName: "Test Choice 2",
                winningChoiceVotes: 140
            },
            activityFeed: {
                icon: "fad fa-poll-h",
                getMessage: (eventData) => {
                    return `Channel poll **${eventData.title}** has progressed`;
                }
            }
        },
        {
            id: "channel-poll-end",
            name: "Channel Poll Ended",
            description: "When a channel poll ends on your channel.",
            cached: false,
            manualMetadata: {
                choices: {
                    type: "poll-choice-list",
                    value: [
                        { id: "c0113c14-144e-475c-9647-a65f9177665d", title: "Test Choice 1", totalVotes: 125, channelPointsVotes: 62 },
                        { id: "6d86797a-d88a-4fc2-b4f6-1895afdc503e", title: "Test Choice 2", totalVotes: 145, channelPointsVotes: 42 },
                        { id: "791bc06c-c4d5-4c74-b950-8596c04dbb0d", title: "Test Choice 3", totalVotes: 85, channelPointsVotes: 72 }
                    ] },
                title: "Test Poll Name",
                winningChoiceName: "Test Choice 2",
                winningChoiceVotes: 145
            },
            activityFeed: {
                icon: "fad fa-poll-h",
                getMessage: (eventData) => {
                    return `Channel poll **${eventData.title}** has ended. Winning choice(s): **${eventData.winningChoiceName}** with **${eventData.winningChoiceVotes}** vote(s)`;
                }
            }
        },
        {
            id: "channel-goal-begin",
            name: "Channel Goal Started",
            description: "When a channel goal begins on your channel.",
            cached: false,
            manualMetadata: {
                description: "Goal name"
            },
            activityFeed: {
                icon: "fad fa-bullseye-arrow",
                getMessage: (eventData) => {
                    let message: string;
                    if (eventData.description) {
                        message = `Channel ${eventData.type} goal **${eventData.description}** has begun (**${eventData.currentAmount}**/**${eventData.targetAmount}**)`;
                    } else {
                        message = `Channel ${eventData.type} goal has begun (**${eventData.currentAmount}**/**${eventData.targetAmount}**)`;
                    }
                    return message;
                }
            }
        },
        {
            id: "channel-goal-progress",
            name: "Channel Goal Progress",
            description: "When a channel goal progresses on your channel.",
            cached: false,
            manualMetadata: {
                description: "Goal name"
            },
            activityFeed: {
                icon: "fad fa-bullseye-arrow",
                getMessage: (eventData) => {
                    let message: string;
                    if (eventData.description) {
                        message = `Channel ${eventData.type} goal **${eventData.description}** has progressed (**${eventData.currentAmount}**/**${eventData.targetAmount}**)`;
                    } else {
                        message = `Channel ${eventData.type} goal has progressed (**${eventData.currentAmount}**/**${eventData.targetAmount}**)`;
                    }
                    return message;
                }
            }
        },
        {
            id: "channel-goal-end",
            name: "Channel Goal Ended",
            description: "When a channel goal ends on your channel.",
            cached: false,
            manualMetadata: {
                description: "Goal name"
            },
            activityFeed: {
                icon: "fad fa-bullseye-arrow",
                getMessage: (eventData) => {
                    let message: string;
                    if (eventData.description) {
                        message = `Channel ${eventData.type} goal **${eventData.description}** has ended. Goal **${
                            eventData.isAchieved ? "was" : "was not"
                        }** achieved. (**${eventData.currentAmount}**/**${eventData.targetAmount}**)`;
                    } else {
                        message = `Channel ${eventData.type} goal has ended. Goal **${
                            eventData.isAchieved ? "was" : "was not"
                        }** achieved. (**${eventData.currentAmount}**/**${eventData.targetAmount}**)`;
                    }
                    return message;
                }
            }
        },
        {
            id: "channel-prediction-begin",
            name: "Channel Prediction Started",
            description: "When a channel prediction begins on your channel.",
            cached: false,
            manualMetadata: {
                title: "Title"
            },
            activityFeed: {
                icon: "fad fa-question-circle",
                getMessage: (eventData) => {
                    return `Channel prediction **${eventData.title}** has begun`;
                }
            }
        },
        {
            id: "channel-prediction-progress",
            name: "Channel Prediction Progress",
            description: "When a channel prediction progresses on your channel.",
            cached: false,
            manualMetadata: {
                title: "Title"
            },
            activityFeed: {
                icon: "fad fa-question-circle",
                getMessage: (eventData) => {
                    return `Channel prediction **${eventData.title}** has progressed`;
                }
            }
        },
        {
            id: "channel-prediction-lock",
            name: "Channel Prediction Locked",
            description: "When a channel prediction is locked on your channel.",
            cached: false,
            manualMetadata: {
                title: "Title"
            },
            activityFeed: {
                icon: "fad fa-question-circle",
                getMessage: (eventData) => {
                    return `Channel prediction **${eventData.title}** has been locked`;
                }
            }
        },
        {
            id: "channel-prediction-end",
            name: "Channel Prediction Ended",
            description: "When a channel prediction ends on your channel.",
            cached: false,
            manualMetadata: {
                title: "Title"
            },
            activityFeed: {
                icon: "fad fa-question-circle",
                getMessage: (eventData) => {
                    return `Channel prediction **${eventData.title}** has ended. Winning outcome: **${eventData.winningOutcome.title}**`;
                }
            }
        },
        {
            id: "hype-train-start",
            name: "Hype Train Started",
            description: "When a hype train starts on your channel.",
            cached: false,
            manualMetadata: {
                total: "150",
                progress: "150",
                goal: "500",
                level: "1",
                isGoldenKappaTrain: false,
                isTreasureTrain: false,
                isSharedTrain: false
            },
            activityFeed: {
                icon: "fad fa-train",
                getMessage: () => {
                    return `Hype train started!`;
                }
            }
        },
        {
            id: "hype-train-progress",
            name: "Hype Train Progress",
            description: "When a hype train progresses on your channel.",
            cached: false,
            manualMetadata: {
                total: "150",
                progress: "150",
                goal: "500",
                level: "1",
                isGoldenKappaTrain: false,
                isTreasureTrain: false,
                isSharedTrain: false
            },
            activityFeed: {
                icon: "fad fa-train",
                getMessage: (eventData) => {
                    return `Level **${eventData.level}** hype train currently at **${Math.floor(
                        (eventData.progress / eventData.goal) * 100
                    )}%**`;
                }
            }
        },
        {
            id: "hype-train-level-up",
            name: "Hype Train Level Up",
            description: "When a hype train on your channel advances to the next level.",
            cached: false,
            manualMetadata: {
                previousLevel: "1",
                level: "2"
            },
            activityFeed: {
                icon: "fad fa-train",
                getMessage: (eventData) => {
                    return `Hype train level **${eventData.level}** unlocked!`;
                }
            }
        },
        {
            id: "hype-train-end",
            name: "Hype Train Ended",
            description: "When a hype train ends on your channel.",
            cached: false,
            manualMetadata: {
                total: "150",
                level: "1",
                isGoldenKappaTrain: false,
                isTreasureTrain: false,
                isSharedTrain: false
            },
            activityFeed: {
                icon: "fad fa-train",
                getMessage: (eventData) => {
                    return `Level **${eventData.level}** hype train ended`;
                }
            }
        },
        {
            id: "stream-online",
            name: "Stream Started",
            description: "When your stream starts.",
            cached: false,
            manualMetadata: {},
            activityFeed: {
                icon: "fad fa-play-circle",
                getMessage: () => {
                    return `Stream started`;
                }
            }
        },
        {
            id: "stream-offline",
            name: "Stream Ended",
            description: "When your stream ends.",
            cached: false,
            manualMetadata: {},
            activityFeed: {
                icon: "fad fa-stop-circle",
                getMessage: () => {
                    return `Stream ended`;
                }
            }
        },
        {
            id: "charity-campaign-start",
            name: "Charity Campaign Started",
            description: "When you start a charity campaign in your channel.",
            cached: false,
            manualMetadata: {
                charityName: "Great Cause, LLC",
                charityDescription: "They do really great stuff",
                charityWebsite: "https://somewebsite.org",
                charityLogo: "https://somewebsite.org/logo.png",
                currentTotalAmount: "10",
                currentTotalCurrency: "USD",
                targetTotalAmount: "1000",
                targetTotalCurrency: "USD"
            },
            activityFeed: {
                icon: "fad fa-ribbon",
                getMessage: (eventData) => {
                    return `Charity campaign benefitting **${eventData.charityName}** has started`;
                }
            }
        },
        {
            id: "charity-donation",
            name: "Charity Donation",
            description: "When someone donates to your channel's charity campaign.",
            cached: false,
            manualMetadata: {
                from: "Firebot",
                charityName: "Great Cause, LLC",
                charityDescription: "They do really great stuff",
                charityWebsite: "https://somewebsite.org",
                charityLogo: "https://somewebsite.org/logo.png",
                donationAmount: "10",
                donationCurrency: "USD"
            },
            activityFeed: {
                icon: "fad fa-hand-holding-heart",
                getMessage: (eventData) => {
                    return `**${eventData.from}** made a charity donation of **${eventData.donationAmount} ${eventData.donationCurrency}**`;
                }
            }
        },
        {
            id: "charity-campaign-progress",
            name: "Charity Campaign Progress",
            description: "When your channel's charity campaign progresses.",
            cached: false,
            manualMetadata: {
                charityName: "Great Cause, LLC",
                charityDescription: "They do really great stuff",
                charityWebsite: "https://somewebsite.org",
                charityLogo: "https://somewebsite.org/logo.png",
                currentTotalAmount: "10",
                currentTotalCurrency: "USD",
                targetTotalAmount: "1000",
                targetTotalCurrency: "USD"
            },
            activityFeed: {
                icon: "fad fa-ribbon",
                getMessage: (eventData) => {
                    return `Charity campaign has progressed. Total so far: **${eventData.currentTotalAmount} ${eventData.currentTotalCurrency}**`;
                }
            }
        },
        {
            id: "charity-campaign-end",
            name: "Charity Campaign Ended",
            description: "When your channel's charity campaign ends.",
            cached: false,
            manualMetadata: {
                charityName: "Great Cause, LLC",
                charityDescription: "They do really great stuff",
                charityWebsite: "https://somewebsite.org",
                charityLogo: "https://somewebsite.org/logo.png",
                currentTotalAmount: "10",
                currentTotalCurrency: "USD",
                targetTotalAmount: "1000",
                targetTotalCurrency: "USD"
            },
            activityFeed: {
                icon: "fad fa-ribbon",
                getMessage: (eventData) => {
                    return `Charity campaign has ended. Goal reached: **${
                        eventData.goalReached ? "Yes" : "No"
                    }**. Total raised: **${eventData.currentTotalAmount} ${eventData.currentTotalCurrency}**`;
                }
            }
        },
        {
            id: "shared-chat-started",
            name: "Shared Chat Session Started",
            description: "When a shared chat session is started with another channel.",
            cached: false
        },
        {
            id: "shared-chat-updated",
            name: "Shared Chat Session Updated",
            description: "When the participants in a shared chat session are updated.",
            cached: false
        },
        {
            id: "shared-chat-ended",
            name: "Shared Chat Session Ended",
            description: "When a shared chat session is ended.",
            cached: false
        },
        {
            id: "shoutout-sent",
            name: "Shoutout Sent",
            description: "When you or a moderator sends a Twitch shoutout to another channel.",
            cached: false,
            manualMetadata: {
                moderator: "Firebot",
                username: "zunderscore",
                userDisplayName: "zunderscore",
                userId: "",
                viewerCount: 10
            },
            activityFeed: {
                icon: "fad fa-bullhorn",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.moderator}** sent a shoutout to **${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }**`;
                }
            }
        },
        {
            id: "shoutout-received",
            name: "Shoutout Received",
            description: "When another channel sends you a Twitch shoutout.",
            cached: false,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                viewerCount: 10
            },
            activityFeed: {
                icon: "fad fa-bullhorn",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${
                        showUserIdName ? ` (${eventData.username})` : ""
                    }** shouted out your channel to ${eventData.viewerCount} viewers`;
                }
            }
        },
        {
            id: "category-changed",
            name: "Category Changed",
            description: "When you change your Twitch stream category.",
            cached: false,
            manualMetadata: {
                category: "Just Chatting"
            },
            activityFeed: {
                icon: "fad fa-th-large",
                getMessage: (eventData) => {
                    return `Twitch stream category changed to **${eventData.category}**`;
                }
            }
        },
        {
            id: "title-changed",
            name: "Title Changed",
            description: "When you change your Twitch stream title.",
            cached: false,
            manualMetadata: {
                title: "Stream Title"
            },
            activityFeed: {
                icon: "fad fa-text",
                getMessage: (eventData) => {
                    return `Twitch stream title changed to **${eventData.title}**`;
                }
            }
        },
        {
            id: "ad-break-upcoming",
            name: "Scheduled Ad Break Starting Soon",
            description: "When a scheduled ad break will be starting soon on your channel.",
            cached: false,
            manualMetadata: {
                adBreakDuration: 60,
                secondsUntilNextAdBreak: 300
            },
            activityFeed: {
                icon: "fad fa-ad",
                getMessage: (eventData) => {
                    const mins = Math.floor(eventData.adBreakDuration / 60);
                    const remainingSecs = eventData.adBreakDuration % 60;

                    const friendlyDuration =
                        mins > 0
                            ? `${mins}m${remainingSecs > 0 ? ` ${remainingSecs}s` : ""}`
                            : `${eventData.adBreakDuration}s`;

                    const minutesUntilNextAdBreak = Math.round(eventData.secondsUntilNextAdBreak / 60);

                    return `**${friendlyDuration}** scheduled ad break starting in about **${minutesUntilNextAdBreak}** minute${
                        minutesUntilNextAdBreak !== 1 ? "s" : ""
                    }`;
                }
            }
        },
        {
            id: "ad-break-start",
            name: "Ad Break Started",
            description: "When an ad break starts on your channel.",
            cached: false,
            manualMetadata: {
                adBreakDuration: 60,
                isAdBreakScheduled: true
            },
            activityFeed: {
                icon: "fad fa-ad",
                getMessage: (eventData) => {
                    const mins = Math.floor(eventData.adBreakDuration / 60);
                    const remainingSecs = eventData.adBreakDuration % 60;

                    const friendlyDuration =
                        mins > 0
                            ? `${mins}m${remainingSecs > 0 ? ` ${remainingSecs}s` : ""}`
                            : `${eventData.adBreakDuration}s`;

                    return `**${friendlyDuration}** **${
                        eventData.isAdBreakScheduled ? "scheduled" : "manual"
                    }** ad break started`;
                }
            }
        },
        {
            id: "ad-break-end",
            name: "Ad Break Ended",
            description: "When an ad break ends on your channel.",
            cached: false,
            manualMetadata: {
                adBreakDuration: 60,
                isAdBreakScheduled: true
            },
            activityFeed: {
                icon: "fad fa-ad",
                getMessage: (eventData) => {
                    const mins = Math.floor(eventData.adBreakDuration / 60);
                    const remainingSecs = eventData.adBreakDuration % 60;

                    const friendlyDuration =
                        mins > 0
                            ? `${mins}m${remainingSecs > 0 ? ` ${remainingSecs}s` : ""}`
                            : `${eventData.adBreakDuration}s`;

                    return `**${friendlyDuration}** **${
                        eventData.isAdBreakScheduled ? "scheduled" : "manual"
                    }** ad break ended`;
                }
            }
        }
    ]
};