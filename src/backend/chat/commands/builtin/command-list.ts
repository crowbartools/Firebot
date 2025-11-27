import { SystemCommand } from "../../../../types/commands";
import * as cloudSync from '../../../cloud-sync';
import { SortTagManager } from "../../../sort-tags/sort-tag-manager";
import { TwitchApi } from "../../../streaming-platforms/twitch/api";

/**
 * The `!commands` command
 */
export const CommandListSystemCommand: SystemCommand<{
    successTemplate: string;
    noCommandsTemplate: string;
    defaultTag?: string;
}> = {
    definition: {
        id: "firebot:commandlist",
        name: "Command List",
        active: true,
        trigger: "!commands",
        description: "Displays a link to your profile page with all available commands.",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        cooldown: {
            user: 0,
            global: 0
        },
        options: {
            successTemplate: {
                type: "string",
                title: "Output Template",
                description: "The chat message to send with a link to your profile page.",
                tip: "Variables: {url}",
                default: `You can view the list of commands here: {url}`,
                useTextArea: true
            },
            noCommandsTemplate: {
                type: "string",
                title: "No Commands Output Template",
                description: "The chat message to send when a user has no commands they are allowed to run.",
                tip: "Variables: {username}",
                default: "{username}, there are no commands that you are allowed to run.",
                useTextArea: true
            },
            defaultTag: {
                type: "sort-tag-select",
                title: "Default Tag",
                description: "The command tag that should be selected by default when users load into your profile page.",
                context: "commands"
            }
        }
    },
    onTriggerEvent: async (event) => {
        const { commandOptions } = event;

        const streamerName = await cloudSync.syncProfileData({
            username: event.chatMessage.username,
            userRoles: event.chatMessage.roles,
            profilePage: "commands"
        });

        let profileUrl = `https://firebot.app/profile/${streamerName}`;

        if (event.commandOptions?.defaultTag) {
            const commandTags = SortTagManager.getSortTagsForContext("commands");
            const defaultTag = commandTags.find(t => t.id === event.commandOptions?.defaultTag);
            if (defaultTag != null) {
                profileUrl += `?commands=${encodeURIComponent(defaultTag.name)}`;
            }
        }

        await TwitchApi.chat.sendChatMessage(commandOptions.successTemplate
            .replaceAll("{url}", profileUrl), null, true
        );
    }
};