import { SystemCommand } from "../../../../types/commands";
import logger from "../../../logwrapper";
import utils from "../../../utility";
import accountAccess from "../../../common/account-access";
import twitchApi from "../../../twitch-api/api";
import chat from "../../twitch-chat";

/**
 * The `!marker` command
 */
export const MarkerSystemCommand: SystemCommand<{
    successTemplate: string;
    unableTemplate: string;
    errorTemplate: string;
}> = {
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
        },
        options: {
            successTemplate: {
                type: "string",
                title: "Output Template",
                description: "The chat message to send when the marker is created.",
                tip: "Variables: {timestamp}",
                default: `Marker created at {timestamp}.`,
                useTextArea: true
            },
            unableTemplate: {
                type: "string",
                title: "Unable Output Template",
                description: "The chat message to send a marker is unable to be created.",
                default: "Unable to create a stream marker.",
                useTextArea: true
            },
            errorTemplate: {
                type: "string",
                title: "Error Output Template",
                description: "The chat message to send when there was an error creating a marker.",
                default: "Failed to create a stream marker.",
                useTextArea: true
            }
        }
    },
    onTriggerEvent: async ({ userCommand, commandOptions }) => {

        const { args } = userCommand;

        const streamer = accountAccess.getAccounts().streamer;

        try {
            const marker = await twitchApi.streamerClient.streams
                .createStreamMarker(streamer.userId, args.join(" "));

            if (marker == null) {
                await chat.sendChatMessage(commandOptions.unableTemplate);
                return;
            }
            await chat.sendChatMessage(
                commandOptions.successTemplate
                    .replace("{timestamp}", utils.formattedSeconds(marker.positionInSeconds, true))
            );
        } catch (error) {
            logger.error(error);
            await chat.sendChatMessage(commandOptions.errorTemplate);
        }
    }
};