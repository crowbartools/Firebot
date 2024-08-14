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
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                viewerCount: 5
            },
            activityFeed: {
                icon: "fad fa-siren-on",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""}** raided with **${eventData.viewerCount}** viewer(s)`;
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
                    return `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""}** followed`;
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
                    return `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""}** ${eventData.isResub ? 'resubscribed' : 'subscribed'} for **${eventData.totalMonths} month(s)** ${eventData.subPlan === 'Prime' ?
                        "with **Twitch Prime**" : `at **Tier ${eventData.subPlan.replace("000", "")}**`}`;
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
                    return `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""}** upgraded their Prime sub at **Tier ${eventData.subPlan.replace("000", "")}!**`;
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
                    return `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""}** upgraded their gift sub at **Tier ${eventData.subPlan.replace("000", "")}!**`;
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
                    return `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""}** cheered **${eventData.bits}** bits. They have cheered a total of **${eventData.totalBits}** in the channel.`;
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
                    return `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""}** unlocked the **${eventData.badgeTier}** bits badge in your channel!`;
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
                    return `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""}** arrived`;
                }
            }
        },
        {
            id: "chat-cleared",
            name: "Chat Cleared",
            description: "When chat is cleared in your channel",
            cached: false,
            queued: false,
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
            queued: false,
            manualMetadata: {
                username: "firebot",
                userDisplayName: "Firebot",
                userId: "",
                messageText: "Test message"
            }
        },
        {
            id: "first-time-chat",
            name: "First Time Chat",
            description: "When someone chats in your channel for the very first time",
            cached: false,
            queued: false,
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
                    return `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""}** has chatted in your channel for the very first time`;
                }
            }
        },
        {
            id: "announcement",
            name: "Announcement",
            description: "When you or a mod sends an announcement in your channel",
            cached: false,
            queued: false,
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
            queued: false,
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
                    let message = `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""}** was banned by **${eventData.moderator}**.`;

                    if (eventData.modReason) {
                        message = `${message} Reason: **${eventData.modReason}**`;
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
                username: "cavemobster",
                userDisplayName: "CaveMobster",
                userId: "",
                moderator: "Firebot"
            },
            activityFeed: {
                icon: "fad fa-gavel",
                getMessage: (eventData) => {
                    const showUserIdName = eventData.username.toLowerCase() !== eventData.userDisplayName.toLowerCase();
                    return `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""}** was unbanned by **${eventData.moderator}**.`;
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
                    let message = `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""}** was timed out for **${eventData.timeoutDuration} sec(s)** by ${eventData.moderator}.`;

                    if (eventData.modReason) {
                        message = `${message} Reason: **${eventData.modReason}**`;
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
            queued: false,
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
                    return `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""}** redeemed **${eventData.rewardName}**${eventData.messageText && !!eventData.messageText.length ? `: *${eventData.messageText}*` : ''}`;
                }
            }
        },
        {
            id: "channel-reward-redemption-fulfilled",
            name: "Channel Reward Redemption Approved",
            description: "When a CUSTOM channel reward redemption is Completed/Approved",
            cached: false,
            cacheMetaKey: "username",
            cacheTtlInSecs: 1,
            queued: false,
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
                    return `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""}**'s redemption of **${eventData.rewardName}** was approved. ${eventData.messageText && !!eventData.messageText.length ? `*${eventData.messageText}*` : ''}`;
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
            queued: false,
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
                    return `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""}**'s redemption of **${eventData.rewardName}** was rejected. ${eventData.messageText && !!eventData.messageText.length ? `*${eventData.messageText}*` : ''}`;
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
                    return `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""}** sent your **${eventData.sentTo}** account the following whisper: ${eventData.message}`;
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
        },
        {
            id: "channel-poll-begin",
            name: "Channel Poll Started",
            description: "When a channel poll begins on your channel.",
            cached: false,
            queued: false,
            manualMetadata: {
                title: "Poll name"
            },
            activityFeed: {
                icon: "fad fa-poll-h",
                getMessage: (eventData) => {
                    return `Channel poll **${eventData.title}** has begun.`;
                }
            }
        },
        {
            id: "channel-poll-progress",
            name: "Channel Poll Progress",
            description: "When a channel poll progresses on your channel.",
            cached: false,
            queued: false,
            manualMetadata: {
                title: "Poll name"
            },
            activityFeed: {
                icon: "fad fa-poll-h",
                getMessage: (eventData) => {
                    return `Channel poll **${eventData.title}** has progressed.`;
                }
            }
        },
        {
            id: "channel-poll-end",
            name: "Channel Poll Ended",
            description: "When a channel poll ends on your channel.",
            cached: false,
            queued: false,
            manualMetadata: {
                title: "Poll name"
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
            queued: false,
            manualMetadata: {
                description: "Goal name"
            },
            activityFeed: {
                icon: "fad fa-bullseye-arrow",
                getMessage: (eventData) => {
                    let message;
                    if (eventData.description) {
                        message = `Channel ${eventData.type} goal **${eventData.description}** has begun (**${eventData.currentAmount}**/**${eventData.targetAmount}**).`;
                    } else {
                        message = `Channel ${eventData.type} goal has begun (**${eventData.currentAmount}**/**${eventData.targetAmount}**).`;
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
            queued: false,
            manualMetadata: {
                description: "Goal name"
            },
            activityFeed: {
                icon: "fad fa-bullseye-arrow",
                getMessage: (eventData) => {
                    let message;
                    if (eventData.description) {
                        message = `Channel ${eventData.type} goal **${eventData.description}** has progressed (**${eventData.currentAmount}**/**${eventData.targetAmount}**).`;
                    } else {
                        message = `Channel ${eventData.type} goal has progressed (**${eventData.currentAmount}**/**${eventData.targetAmount}**).`;
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
            queued: false,
            manualMetadata: {
                description: "Goal name"
            },
            activityFeed: {
                icon: "fad fa-bullseye-arrow",
                getMessage: (eventData) => {
                    let message;
                    if (eventData.description) {
                        message = `Channel ${eventData.type} goal **${eventData.description}** has ended. Goal **${eventData.isAchieved ? "was" : "was not"}** achieved. (**${eventData.currentAmount}**/**${eventData.targetAmount}**).`;
                    } else {
                        message = `Channel ${eventData.type} goal has ended. Goal **${eventData.isAchieved ? "was" : "was not"}** achieved. (**${eventData.currentAmount}**/**${eventData.targetAmount}**).`;
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
            queued: false,
            manualMetadata: {
                title: "Title"
            },
            activityFeed: {
                icon: "fad fa-question-circle",
                getMessage: (eventData) => {
                    return `Channel prediction **${eventData.title}** has begun.`;
                }
            }
        },
        {
            id: "channel-prediction-progress",
            name: "Channel Prediction Progress",
            description: "When a channel prediction progresses on your channel.",
            cached: false,
            queued: false,
            manualMetadata: {
                title: "Title"
            },
            activityFeed: {
                icon: "fad fa-question-circle",
                getMessage: (eventData) => {
                    return `Channel prediction **${eventData.title}** has progressed.`;
                }
            }
        },
        {
            id: "channel-prediction-lock",
            name: "Channel Prediction Locked",
            description: "When a channel prediction is locked on your channel.",
            cached: false,
            queued: false,
            manualMetadata: {
                title: "Title"
            },
            activityFeed: {
                icon: "fad fa-question-circle",
                getMessage: (eventData) => {
                    return `Channel prediction **${eventData.title}** has been locked.`;
                }
            }
        },
        {
            id: "channel-prediction-end",
            name: "Channel Prediction Ended",
            description: "When a channel prediction ends on your channel.",
            cached: false,
            queued: false,
            manualMetadata: {
                title: "Title"
            },
            activityFeed: {
                icon: "fad fa-question-circle",
                getMessage: (eventData) => {
                    return `Channel prediction **${eventData.title}** has ended. Winning outcome: **${eventData.winningOutcome.title}**.`;
                }
            }
        },
        {
            id: "hype-train-start",
            name: "Hype Train Started",
            description: "When a hype train starts on your channel.",
            cached: false,
            queued: false,
            manualMetadata: {
                total: "150",
                progress: "150",
                goal: "500",
                level: "1"
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
            queued: false,
            manualMetadata: {
                total: "150",
                progress: "150",
                goal: "500",
                level: "1"
            },
            activityFeed: {
                icon: "fad fa-train",
                getMessage: (eventData) => {
                    return `Level **${eventData.level}** hype train currently at **${Math.floor((eventData.progress / eventData.goal) * 100)}%**.`;
                }
            }
        },
        {
            id: "hype-train-end",
            name: "Hype Train Ended",
            description: "When a hype train ends on your channel.",
            cached: false,
            queued: false,
            manualMetadata: {
                total: "150",
                level: "1"
            },
            activityFeed: {
                icon: "fad fa-train",
                getMessage: (eventData) => {
                    return `Level **${eventData.level}** hype train ended.`;
                }
            }
        },
        {
            id: "stream-online",
            name: "Stream Started",
            description: "When your stream starts.",
            cached: false,
            queued: false,
            manualMetadata: { },
            activityFeed: {
                icon: "fad fa-play-circle",
                getMessage: () => {
                    return `Stream started.`;
                }
            }
        },
        {
            id: "stream-offline",
            name: "Stream Ended",
            description: "When your stream ends.",
            cached: false,
            queued: false,
            manualMetadata: { },
            activityFeed: {
                icon: "fad fa-stop-circle",
                getMessage: () => {
                    return `Stream ended.`;
                }
            }
        },
        {
            id: "charity-campaign-start",
            name: "Charity Campaign Started",
            description: "When you start a charity campaign in your channel.",
            cached: false,
            queued: false,
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
                    return `Charity campaign benefitting **${eventData.charityName}** has started.`;
                }
            }
        },
        {
            id: "charity-donation",
            name: "Charity Donation",
            description: "When someone donates to your channel's charity campaign.",
            cached: false,
            queued: false,
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
                    return `**${eventData.from}** made a charity donation of **${eventData.donationAmount} ${eventData.donationCurrency}**.`;
                }
            }
        },
        {
            id: "charity-campaign-progress",
            name: "Charity Campaign Progress",
            description: "When your channel's charity campaign progresses.",
            cached: false,
            queued: false,
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
                    return `Charity campaign has progressed. Total so far: **${eventData.currentTotalAmount} ${eventData.currentTotalCurrency}**.`;
                }
            }
        },
        {
            id: "charity-campaign-end",
            name: "Charity Campaign Ended",
            description: "When your channel's charity campaign ends.",
            cached: false,
            queued: false,
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
                    return `Charity campaign has ended. Goal reached: **${eventData.goalReached ? "Yes" : "No"}**. Total raised: **${eventData.currentTotalAmount} ${eventData.currentTotalCurrency}**.`;
                }
            }
        },
        {
            id: "shoutout-sent",
            name: "Shoutout Sent",
            description: "When you or a moderator sends a Twitch shoutout to another channel.",
            cached: false,
            queued: false,
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
                    return `**${eventData.moderator}** sent a shoutout to **${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""}**`;
                }
            }
        },
        {
            id: "shoutout-received",
            name: "Shoutout Received",
            description: "When another channel sends you a Twitch shoutout.",
            cached: false,
            queued: false,
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
                    return `**${eventData.userDisplayName}${showUserIdName ? ` (${eventData.username})` : ""}** shouted out your channel to ${eventData.viewerCount} viewers`;
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

                    const friendlyDuration = mins > 0
                        ? `${mins}m${remainingSecs > 0 ? ` ${remainingSecs}s` : ""}`
                        : `${eventData.adBreakDuration}s`;

                    const minutesUntilNextAdBreak = Math.round(eventData.secondsUntilNextAdBreak / 60);

                    return `**${friendlyDuration}** scheduled ad break starting in about **${minutesUntilNextAdBreak}** minute${minutesUntilNextAdBreak !== 1 ? "s" : ""}`;
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

                    const friendlyDuration = mins > 0
                        ? `${mins}m${remainingSecs > 0 ? ` ${remainingSecs}s` : ""}`
                        : `${eventData.adBreakDuration}s`;

                    return `**${friendlyDuration}** **${eventData.isAdBreakScheduled ? "scheduled" : "manual"}** ad break started`;
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

                    const friendlyDuration = mins > 0
                        ? `${mins}m${remainingSecs > 0 ? ` ${remainingSecs}s` : ""}`
                        : `${eventData.adBreakDuration}s`;

                    return `**${friendlyDuration}** **${eventData.isAdBreakScheduled ? "scheduled" : "manual"}** ad break ended`;
                }
            }
        }
    ]
};