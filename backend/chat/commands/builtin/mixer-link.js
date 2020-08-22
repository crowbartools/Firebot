"use strict";

const mixerLink = {
    definition: {
        id: "firebot:linkmixer",
        name: "Link Mixer Management",
        active: true,
        trigger: "!linkmixer",
        description: "Allows users to link their mixer account data to their twitch account data in Firebot (such as currency amounts)",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        cooldown: {
            user: 0,
            global: 0
        },
        subCommands: [
            {
                id: "link",
                arg: "link",
                minArgs: 2,
                usage: "link [@MixerUsername]",
                description: "Request to link your current twitch account to a mixer account"
            },
            {
                id: "approve",
                arg: "approve",
                minArgs: 2,
                usage: "approve [@TwitchUsername]",
                description: "Approves a requested account link",
                restrictionData: {
                    restrictions: [
                        {
                            id: "sys-cmd-mods-only-perms",
                            type: "firebot:permissions",
                            mode: "roles",
                            roleIds: [
                                "mod",
                                "broadcaster"
                            ]
                        }
                    ]
                }
            },
            {
                id: "deny",
                arg: "deny",
                minArgs: 2,
                usage: "deny [@TwitchUsername]",
                description: "Denies a requested account link",
                restrictionData: {
                    restrictions: [
                        {
                            id: "sys-cmd-mods-only-perms",
                            type: "firebot:permissions",
                            mode: "roles",
                            roleIds: [
                                "mod",
                                "broadcaster"
                            ]
                        }
                    ]
                }
            },
            {
                id: "manual",
                arg: "manuallink",
                minArgs: 3,
                usage: "manuallink [@TwitchUsername] [@MixerUsername]",
                description: "Allows mods to manually create a link request for a twitch user, still requires approval.",
                restrictionData: {
                    restrictions: [
                        {
                            id: "sys-cmd-mods-only-perms",
                            type: "firebot:permissions",
                            mode: "roles",
                            roleIds: [
                                "mod",
                                "broadcaster"
                            ]
                        }
                    ]
                }
            }
        ]
    },
    onTriggerEvent: async event => {
        const logger = require("../../../logwrapper");
        const chat = require("../../twitch-chat");
        const mixerLinkManager = require("../../../mixer-link-manager/mixer-link-manager");

        const commandSender = event.userCommand.commandSender;
        const args = event.userCommand.args;
        const subcommandId = event.userCommand.subcommandId;

        if (args.length < 1 || subcommandId == null) {
            chat.sendChatMessage(`Invalid command usage: ${event.userCommand.trigger} link @MixerUsername`);
            return;
        }

        switch (subcommandId) {
        case "link": {
            const mixerUsername = args[1].replace("@", "");
            try {
                await mixerLinkManager.addLinkRequest(commandSender, mixerUsername);
                chat.sendChatMessage(`@${commandSender} has requested a link to the Mixer user '${mixerUsername}'. Mods can approve this link by typing '${event.userCommand.trigger} approve @${commandSender}' within 60 secs.`);
            } catch (error) {
                chat.sendChatMessage(`Unable to create a link request for @${commandSender} because: ${error.message}`);
                logger.warn(error);
            }
            return;
        }
        case "approve": {
            const twitchUsername = args[1].replace("@", "");

            if (!mixerLinkManager.linkRequestExists(twitchUsername)) {
                chat.sendChatMessage(`There is not an active link request for Twitch user '${twitchUsername}'. Mods can manually create a link request by typing '${event.userCommand.trigger} manuallink @TwitchUsername @MixerUsername'`);
                return;
            }

            try {
                await mixerLinkManager.approveLinkRequest(twitchUsername, commandSender);
                chat.sendChatMessage(`@${twitchUsername} has been successfully linked to their Mixer data. View time and currency values have been merged.`);
            } catch (error) {
                chat.sendChatMessage(`Could not complete the link for @${twitchUsername} because: ${error.message}`);
                logger.warn(error);
            }
            return;
        }
        case "deny": {
            const twitchUsername = args[1].replace("@", "");

            if (!mixerLinkManager.linkRequestExists(twitchUsername)) {
                chat.sendChatMessage(`There is not an active link request for Twitch user '${twitchUsername}'.`);
                return;
            }

            mixerLinkManager.denyLinkRequest(twitchUsername);
            chat.sendChatMessage(`The link request by '${twitchUsername}' has been denied.`);
            return;
        }
        case "manual": {
            const twitchUsername = args[1].replace("@", "");
            const mixerUsername = args[2].replace("@", "");
            try {
                await mixerLinkManager.addLinkRequest(twitchUsername, mixerUsername);
                chat.sendChatMessage(`Succesfully created a request to link @${twitchUsername} to the Mixer user '${mixerUsername}'. Mods can approve this link by typing '${event.userCommand.trigger} approve @${twitchUsername}' within 60 secs.`);
            } catch (error) {
                chat.sendChatMessage(`Unable to create a link request for @${twitchUsername} because: ${error.message}`);
                logger.warn(error);
            }
            return;
        }
        }
    }
};

module.exports = mixerLink;