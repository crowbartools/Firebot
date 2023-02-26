"use strict";

const twitchApi = require("../../../twitch-api/api");
const accountAccess = require("../../../common/account-access");
const chat = require("../../twitch-chat");
const logger = require("../../../logwrapper");
const utils = require("../../../utility");

const model = {
    definition: {
        id: "firebot:create-marker",
        name: "Create Stream Marker",
        active: true,
        trigger: "!marker",
        usage: "[marker name]",
        description: "Create a stream marker.",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        minArgs: 1,
        cooldown: {
            user: 0,
            global: 0
        },
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
    onTriggerEvent: async event => {

        const { args } = event.userCommand;

        const streamer = accountAccess.getAccounts().streamer;

        try {
            const marker = await twitchApi.streamerClient.streams
                .createStreamMarker(streamer.userId, args.join(" "));

            if (marker == null) {
                await chat.sendChatMessage(`Unable to create a stream marker.`);
                return;
            }
            await chat.sendChatMessage(`Marker created at ${utils.formattedSeconds(marker.positionInSeconds, true)}`);
        } catch (error) {
            logger.error(error);
            await chat.sendChatMessage(`Failed to create a stream marker.`);
        }
    }
};

module.exports = model;
