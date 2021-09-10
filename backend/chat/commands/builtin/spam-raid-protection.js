"use strict";

const chat = require("../../twitch-chat");
const chatModerationManager = require("../../moderation/chat-moderation-manager");

const spamRaidProtection = {
    definition: {
        id: "firebot:spamRaidProtection",
        name: "Spam Raid Protection",
        active: true,
        hidden: false,
        trigger: "!spamraidprotection",
        description: "Toggles protective measures like chat clearing, follow only, sub only, emote only and slow mode, as well as whether spam raiders should be banned and/or blocked or not.",
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
                description: "A message that will tell the users what is going on.",
                default: `We are currently experiencing a spam raid, and have therefore temporarily turned on protective measures.`,
                useTextArea: true
            },
            enableFollowerOnly: {
                type: "boolean",
                title: "Follower only mode",
                description: "Allows you to restrict chat to all or some of your followers, based on how long they’ve followed (0 minutes to 3 months).",
                default: false
            },
            enableFollowerOnlyDuration: {
                type: "string",
                title: "Follower only mode duration (formats: 1m / 1h / 1d / 1w / 1mo)",
                description: "Allows you to restrict chat to all or some of your followers, based on how long they’ve followed (0 minutes to 3 months).",
                default: "15m"
            },
            enableEmoteOnly: {
                type: "boolean",
                title: "Emote only mode",
                description: "Chatters can only chat with Twitch emotes.",
                default: false
            },
            enableSubscriberOnly: {
                type: "boolean",
                title: "Subscriber only mode",
                description: "Only subscribers to the channel are allowed to chat.",
                default: false
            },
            enableSlowMode: {
                type: "boolean",
                title: "Slow mode",
                description: "In slow mode, users can only post one chat message every x seconds.",
                default: false
            },
            enableSlowModeDelay: {
                type: "number",
                title: "Slow mode delay in seconds",
                description: "In slow mode, users can only post one chat message every x seconds.",
                default: 30
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
        },
        subCommands: [
            {
                arg: "off",
                usage: "off",
                description: "Turn off the protection command.",
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
                }
            },
            {
                arg: "followonly",
                usage: "followonly",
                description: "Toggles the follow-only mode setting.",
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
                }
            },
            {
                arg: "subonly",
                usage: "subonly",
                description: "Toggles the subscriber-only mode setting.",
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
                }
            },
            {
                arg: "emoteonly",
                usage: "emoteonly",
                description: "Toggles the emote-only mode setting.",
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
                }
            },
            {
                arg: "slow",
                usage: "slow",
                description: "Toggles the slow mode setting.",
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
                }
            },
            {
                arg: "chatclear",
                usage: "chatclear",
                description: "Toggles the setting to clear chat.",
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
                }
            },
            {
                arg: "ban",
                usage: "ban",
                description: "Toggles the setting to ban spam raiders.",
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
                }
            },
            {
                arg: "block",
                usage: "block",
                description: "Toggles the setting to block spam raiders.",
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
                }
            }
        ]
    },
    /**
     * When the command is triggered
     */
    onTriggerEvent: async event => {
        const { commandOptions } = event;
        const args = event.userCommand.args;

        if (args.length === 0) {
            if (commandOptions.enableFollowerOnly) {
                chat.enableFollowersOnly(commandOptions.enableFollowerOnlyDuration);
            }

            if (commandOptions.enableSubscriberOnly) {
                chat.enableSubscribersOnly();
            }

            if (commandOptions.enableEmoteOnly) {
                chat.enableEmoteOnly();
            }

            if (commandOptions.enableSlowMode) {
                chat.enableSlowMode(commandOptions.enableSlowModeDelay);
            }

            if (commandOptions.clearChat) {
                chat.clearChat();
            }

            if (commandOptions.banRaiders || commandOptions.blockRaiders) {
                chatModerationManager.enableSpamRaidProtection(commandOptions.banRaiders, commandOptions.blockRaiders);
            }

            setTimeout(function() {
                (function(commandOptions) {
                    chat.sendChatMessage(commandOptions.displayTemplate);
                }(commandOptions));
            }, 2000);
        }

        if (args[0] === "off") {
            chat.disableFollowersOnly();
            chat.disableSubscribersOnly();
            chat.disableEmoteOnly();
            chat.disableSlowMode();
            chatModerationManager.disableSpamRaidProtection();

            chat.sendChatMessage("Protection turned off.");
        }
    }
};

module.exports = spamRaidProtection;