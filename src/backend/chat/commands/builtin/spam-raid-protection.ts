import { SystemCommand } from "../../../../types/commands";
import { TwitchApi } from "../../../streaming-platforms/twitch/api";
import { TwitchSlashCommandHelpers } from "../../../streaming-platforms/twitch/chat/slash-commands/twitch-command-helpers";
import raidMessageChecker from "../../moderation/raid-message-checker";

/**
 * The `!spamraidprotection` command
 */
export const SpamRaidProtectionSystemCommand: SystemCommand<{
    displayTemplate: string;
    enableFollowerOnly: boolean;
    enableFollowerOnlyDuration: string;
    enableEmoteOnly: boolean;
    enableSubscriberOnly: boolean;
    enableSlowMode: boolean;
    enableSlowModeDelay: number;
    clearChat: boolean;
    blockRaiders: boolean;
    banRaiders: boolean;
}> = {
    definition: {
        id: "firebot:spamRaidProtection",
        name: "Spam Raid Protection",
        active: true,
        hidden: false,
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
            }
        ]
    },
    onTriggerEvent: async (event) => {
        const { commandOptions } = event;
        const args = event.userCommand.args;

        if (args.length === 0) {
            if (commandOptions.enableFollowerOnly) {
                const duration = TwitchSlashCommandHelpers.getRawDurationInSeconds(commandOptions.enableFollowerOnlyDuration);
                await TwitchApi.chat.setFollowerOnlyMode(true, duration);
            }

            if (commandOptions.enableSubscriberOnly) {
                await TwitchApi.chat.setSubscriberOnlyMode(true);
            }

            if (commandOptions.enableEmoteOnly) {
                await TwitchApi.chat.setEmoteOnlyMode(true);
            }

            if (commandOptions.enableSlowMode) {
                await TwitchApi.chat.setSlowMode(true, commandOptions.enableSlowModeDelay);
            }

            if (commandOptions.clearChat) {
                await TwitchApi.chat.clearChat();
            }

            if (commandOptions.banRaiders || commandOptions.blockRaiders) {
                await raidMessageChecker.enable(commandOptions.banRaiders, commandOptions.blockRaiders);
            }

            await TwitchApi.chat.sendChatMessage(commandOptions.displayTemplate, null, true);
        }

        if (args[0] === "off") {
            await TwitchApi.chat.setFollowerOnlyMode(false);
            await TwitchApi.chat.setSubscriberOnlyMode(false);
            await TwitchApi.chat.setEmoteOnlyMode(false);
            await TwitchApi.chat.setSlowMode(false);

            raidMessageChecker.disable();

            await TwitchApi.chat.sendChatMessage("Protection turned off.", null, true);
        }
    }
};