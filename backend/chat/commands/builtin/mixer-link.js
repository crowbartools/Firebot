"use strict";

const mixerLinkManager = require("../../../mixer-link-manager/mixer-link-manager");

const mixerLink = {
    definition: {
        id: "firebot:linkmixer",
        name: "Link Mixer Management",
        active: true,
        trigger: "!mixerlink",
        description: "Allows users to link their mixer account to their twitch account",
        autoDeleteTrigger: true,
        scanWholeMessage: false,
        cooldown: {
            user: 0,
            global: 0
        },
        subcommands: [
            {
                arg: "link",
                usage: "link [@MixerUsername]",
                description: "Request to link your current twitch account to a mixer account"
            },
            {
                arg: "approve",
                usage: "approve [@TwitchUsername]",
                description: "Approves a requested account link",
                restrictionData: {
                    restrictions: [
                        {
                            id: "sys-cmd-mods-only-perms",
                            type: "firebot:permissions",
                            mode: "roles",
                            roleIds: [
                                "Mod",
                                "ChannelEditor",
                                "Owner"
                            ]
                        }
                    ]
                }
            },
            {
                arg: "deny",
                usage: "deny [@TwitchUsername]",
                description: "Denies a requested account link",
                restrictionData: {
                    restrictions: [
                        {
                            id: "sys-cmd-mods-only-perms",
                            type: "firebot:permissions",
                            mode: "roles",
                            roleIds: [
                                "Mod",
                                "ChannelEditor",
                                "Owner"
                            ]
                        }
                    ]
                }
            },
            {
                arg: "set",
                usage: "set [@TwitchUsername] [@MixerUsername]",
                description: "Sets the specified user's mixer link",
                restrictionData: {
                    restrictions: [
                        {
                            id: "sys-cmd-mods-only-perms",
                            type: "firebot:permissions",
                            mode: "roles",
                            roleIds: [
                                "Mod",
                                "ChannelEditor",
                                "Owner"
                            ]
                        }
                    ]
                }
            }
        ]
    },
    onTriggerEvent: async event => {
        const logger = require("../../../logwrapper");
        const chat = require("../../chat");

        let linkManager = await mixerLinkManager();

        const args = event.userCommand.args;
        const subcommand = args[0];

        switch (subcommand) {
        case "link":
            // todo
            return;
        case "approve":
            // todo
            return;
        case "deny":
            // todo
            return;
        case "set":
            // todo
            return;
        default:
            // todo
            return;
        }
    }
};

module.exports = mixerLink;