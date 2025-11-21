import { SystemCommand } from "../../../../types/commands";
import logger from "../../../logwrapper";
import { humanizeTime } from "../../../utils";
import { TwitchApi } from "../../../streaming-platforms/twitch/api";

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

        try {
            const marker = await TwitchApi.streams.createStreamMarker(args.join(" "));

            if (marker == null) {
                await TwitchApi.chat.sendChatMessage(commandOptions.unableTemplate, null, true);
                return;
            }
            await TwitchApi.chat.sendChatMessage(
                commandOptions.successTemplate
                    .replaceAll("{timestamp}", humanizeTime(marker.positionInSeconds, "simple")),
                null,
                true
            );
        } catch (error) {
            logger.error(`Error running !marker`, error);
            await TwitchApi.chat.sendChatMessage(commandOptions.errorTemplate, null, true);
        }
    }
};