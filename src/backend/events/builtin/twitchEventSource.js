"use strict";

module.exports = {
    id: "twitch",
    name: "Twitch",
    description: "Events like Follow, Subscribe, and more from Twitch",
    events: [
        {
            id: "raid",
            name: "Raid",
            description: "When someone raids your channel.",
            cached: true,
            cacheMetaKey: "username",
            manualMetadata: {
                username: "Firebot",
                viewerCount: 5
            },
            activityFeed: {
                icon: "fad fa-siren-on",
                getMessage: (eventData) => {
                    return `**${eventData.username}** raided with **${eventData.viewerCount}** viewer(s)`;
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
                username: "Firebot"
            },
            activityFeed: {
                icon: "fas fa-heart",
                getMessage: (eventData) => {
                    return `**${eventData.username}** followed`;
                }
            }
        },
        {
            id: "sub",
            name: "Sub",
            description: "When someone subscribes (or resubscribes) to your channel.",
            cached: false,
            manualMetadata: {
                username: "Firebot",
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
                    return `**${eventData.username}** ${eventData.isResub ? 'resubscribed' : 'subscribed'} for **${eventData.totalMonths} month(s)** ${eventData.subPlan === 'Prime' ?
                        "with **Twitch Prime**" : "at **Tier " + eventData.subPlan.replace("000", "") + "**"}`;
                }
            }
        },
        {
            id: "prime-sub-upgraded",
            name: "Prime Sub Upgraded",
            description: "When someone upgrades to a paid sub from a Prime sub.",
            cached: false,
            manualMetadata: {
                username: "Firebot",
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
                    return `**${eventData.username}** upgraded their Prime sub at **Tier ${eventData.subPlan.replace("000", "")}!**`;
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
                giftSubMonths: 5,
                giftDuration: 1,
                gifteeUsername: "MageEnclave"
            },
            activityFeed: {
                icon: "fad fa-gift",
                getMessage: (eventData) => {
                    return `**${eventData.isAnonymous ? "An Anonymous Gifter" : eventData.gifterUsername}** gifted a ${eventData.giftDuration > 1 ? ` **${eventData.giftDuration} month** ` : ''} **Tier ${eventData.subPlan.replace("000", "")}** sub to **${eventData.gifteeUsername}** (Subbed for ${eventData.giftSubMonths} month${eventData.giftSubMonths > 1 ? 's' : ''} total)`;
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
                        { gifteeUsername: "User1", giftSubMonths: 3 },
                        { gifteeUsername: "User2", giftSubMonths: 5 },
                        { gifteeUsername: "User3", giftSubMonths: 8 },
                        { gifteeUsername: "User4", giftSubMonths: 10 },
                        { gifteeUsername: "User5", giftSubMonths: 16 }
                    ]
                }
            },
            activityFeed: {
                icon: "fad fa-gifts",
                getMessage: (eventData) => {
                    return `**${eventData.isAnonymous ? "An Anonymous Gifter" : eventData.gifterUsername}** gifted **${eventData.subCount} Tier ${eventData.subPlan.replace("000", "")}** sub${eventData.subCount > 1 ? 's' : ''} to the community`;
                }
            }
        },
        {
            id: "gift-sub-upgraded",
            name: "Gift Sub Upgraded",
            description: "When someone upgrades to a paid sub from a gift sub.",
            cached: false,
            manualMetadata: {
                username: "CaveMobster",
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
                    return `**${eventData.username}** upgraded their gift sub at **Tier ${eventData.subPlan.replace("000", "")}!**`;
                }
            }
        },
        {
            id: "cheer",
            name: "Cheer",
            description: "When someone cheers in your channel (uses bits).",
            cached: false,
            manualMetadata: {
                username: "Firebot",
                isAnonymous: false,
                bits: 100,
                totalBits: 1200,
                cheerMessage: "cheer100 Test message"
            },
            activityFeed: {
                icon: "fad fa-diamond",
                getMessage: (eventData) => {
                    return `**${eventData.username}** cheered **${eventData.bits}** bits. A total of **${eventData.totalBits}** were cheered by **${eventData.username}** in the channel.`;
                }
            }
        },
        {
            id: "bits-badge-unlocked",
            name: "Bits Badge Unlocked",
            description: "When someone unlocks a new bits badge tier in your channel.",
            cached: false,
            manualMetadata: {
                username: "Firebot",
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
                    return `**${eventData.username}** unlocked the **${eventData.badgeTier}** bits badge in your channel!`;
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
                username: "Firebot"
            },
            activityFeed: {
                icon: "fad fa-house-return",
                getMessage: (eventData) => {
                    return `**${eventData.username}** arrived`;
                }
            }
        },
        {
            id: "chat-message",
            name: "Chat Message",
            description: "When someone chats in your channel",
            cached: false,
            queued: false,
            manualMetadata: {
                username: "Firebot",
                messageText: "Test message"
            }
        },
        {
            id: "announcement",
            name: "Announcement",
            description: "When you or a mod sends an announcement in your channel",
            cached: false,
            queued: false,
            manualMetadata: {
                username: "Firebot",
                messageText: "Test announcement"
            }
        },
        {
            id: "banned",
            name: "Viewer Banned",
            description: "When someone is banned in your channel",
            cached: false,
            queued: false,
            manualMetadata: {
                username: "CaveMobster",
                moderator: "Firebot",
                modReason: "They were extra naughty"
            },
            activityFeed: {
                icon: "fad fa-gavel",
                getMessage: (eventData) => {
                    let message;
                    if (eventData.modReason) {
                        message = `**${eventData.username}** was banned by **${eventData.moderator}**. Reason: **${eventData.modReason}**`;
                    } else {
                        message = `**${eventData.username}** was banned by **${eventData.moderator}**.`;
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
            queued: false,
            manualMetadata: {
                username: "CaveMobster",
                moderator: "Firebot"
            },
            activityFeed: {
                icon: "fad fa-gavel",
                getMessage: (eventData) => {
                    return `**${eventData.username}** was unbanned by **${eventData.moderator}**.`;
                }
            }
        },
        {
            id: "timeout",
            name: "Viewer Timeout",
            description: "When someone is timed out in your channel",
            cached: false,
            queued: false,
            manualMetadata: {
                username: "ebiggz",
                timeoutDuration: "1",
                moderator: "Firebot",
                modReason: "They were naughty"
            },
            activityFeed: {
                icon: "fad fa-stopwatch",
                getMessage: (eventData) => {
                    return `**${eventData.username}** was timed out for **${eventData.timeoutDuration} sec(s)** by ${eventData.moderator}. Reason: **${eventData.modReason}**`;
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
            queued: false,
            manualMetadata: {
                username: "Firebot",
                rewardName: "Test Reward",
                rewardImage: "https://static-cdn.jtvnw.net/automatic-reward-images/highlight-1.png",
                rewardCost: "200",
                messageText: "Test message"
            },
            activityFeed: {
                icon: "fad fa-circle",
                getMessage: (eventData) => {
                    return `**${eventData.username}** redeemed **${eventData.rewardName}**${eventData.messageText && !!eventData.messageText.length ? `: *${eventData.messageText}*` : ''}`;
                }
            }
        },
        {
            id: "whisper",
            name: "Whisper",
            description: "When someone sends you a whisper.",
            cached: true,
            manualMetadata: {
                username: "Firebot",
                message: "Test whisper"
            },
            activityFeed: {
                icon: "fad fa-comment-alt",
                getMessage: (eventData) => {
                    return `**${eventData.username}** sent you the following whisper: ${eventData.message}`;
                }
            }
        },
        {
            id: "chat-mode-changed",
            name: "Chat Mode Changed",
            description: "When the chat mode settings have been updated by a moderator.",
            cached: false,
            queued: false,
            manualMetadata: {
                chatMode: {
                    type: "enum",
                    options: {
                        "emoteonly": "Emote Only",
                        "subscribers": "Subscribers Only",
                        "followers": "Followers",
                        "slow": "Slow",
                        "r9kbeta": "Unique Chat"
                    },
                    value: "emoteonly"
                },
                chatModeState: {
                    type: "enum",
                    options: {
                        "enabled": "Enabled",
                        "disabled": "Disabled"
                    },
                    value: "enabled"
                },
                moderator: "Firebot",
                duration: "30"
            },
            activityFeed: {
                icon: "fad fa-comment-alt",
                getMessage: (eventData) => {
                    return `**${eventData.moderator}** has set the chat mode to **${eventData.chatMode}**.`;
                }
            }
        }
    ]
};
