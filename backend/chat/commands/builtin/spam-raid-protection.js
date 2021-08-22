"use strict";

const chat = require("../../twitch-chat");

const spamRaidProtection = {
    definition: {
        id: "firebot:spamRaidProtection",
        name: "Spam Raid Protection",
        active: true,
        hidden: true,
        trigger: "!spamraidprotection",
        description: "Toggles protective measures such as follow-only mode, slow mode, etc.",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        cooldown: {
            user: 0,
            global: 30
        },
        restrictionData: {
            restrictions: [
                {
                    id: "sys-cmd-mods-only-perms",
                    type: "firebot:permissions",
                    mode: "roles",
                    roleIds: [
                        "broadcaster",
                        "mod"
                    ]
                }
            ]
        },
        options: {
            displayTemplate: {
                type: "string",
                title: "Output Template",
                description: "A message that will tell the users what is going on",
                default: `We are currently experiencing a spam raid, and have therefore temporarily turned on protective measures.`,
                showBottomHr: true,
                useTextArea: true
            },
            twitch: {
                type: "nested",
                name: "Twitch settings",
                description: "Settings that change chat modes on Twitch or do other Twitch-related things.",
                subOptions: {
                    toggleFollowerOnly: {
                        type: "boolean",
                        title: "Follower only mode",
                        description: "Follower mode only allows chat message from followers that have a follow age of 15 minutes and longer.",
                        default: true
                    },
                    toggleEmoteOnly: {
                        type: "boolean",
                        title: "Emote only mode",
                        description: "Chatters can only chat with Twitch emotes.",
                        default: false
                    },
                    toggleSubscriberOnly: {
                        type: "boolean",
                        title: "Subscriber only mode",
                        description: "Only subscribers to the channel are allowed to chat.",
                        default: false
                    },
                    toggleSlowMode: {
                        type: "boolean",
                        title: "Slow mode",
                        description: "In slow mode, users can only post one chat message every 30 seconds.",
                        default: true
                    },
                    toggleUniqueChat: {
                        type: "boolean",
                        title: "Unique chat mode",
                        description: "Chatters cannot post the same message two times in a row.",
                        default: true
                    },
                    clearChat: {
                        type: "boolean",
                        title: "Clear chat",
                        description: "The chat will be cleared.",
                        default: true
                    },
                    blockRaiders: {
                        type: "boolean",
                        title: "Block raiders",
                        description: "Block every user that posted the raid message.",
                        default: true
                    },
                    banRaiders: {
                        type: "boolean",
                        title: "Ban raiders",
                        description: "Ban every user that posted the raid message from your channel.",
                        default: true
                    }
                }
            },
            firebot: {
                type: "nested",
                name: "Firebot settings",
                description: "Settings that change things within Firebot.",
                subOptions: {
                    disableEvents: {
                        type: "boolean",
                        title: "Disable events",
                        description: "This disables the Firebot events of your choice.",
                        default: false,
                        showBottomHr: true,
                        settings: {}
                    },
                    clearEffects: {
                        type: "boolean",
                        title: "Clear effects",
                        description: "Clear Firebot effects, to prevent any, for example, queued follow alerts from going off.",
                        default: true
                    },
                    clearSounds: {
                        type: "boolean",
                        title: "Clear sounds",
                        description: "Clear Firebot sounds, to prevent any queued sound effects from going off.",
                        default: true
                    }
                }
            }
        }
    },
    /**
     * When the command is triggered
     */
    onTriggerEvent: async event => {
        const { commandOptions } = event;
        chat.sendChatMessage(commandOptions.spamRaidProtectionTemplate);
    }
};

module.exports = spamRaidProtection;