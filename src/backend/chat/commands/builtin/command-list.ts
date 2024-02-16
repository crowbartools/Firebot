import { SystemCommand } from "../../../../types/commands";

/**
 * The `!commands` command
 */
export const CommandListSystemCommand: SystemCommand<{
    successTemplate: string;
    noCommandsTemplate: string;
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
            }
        }
    },
    onTriggerEvent: async (event) => {
        const cloudSync = require('../../../cloud-sync/profile-sync.js');
        const twitchChat = require("../../twitch-chat.js");

        const { commandOptions } = event;

        const profileJSON = {
            username: event.chatMessage.username,
            userRoles: event.chatMessage.roles,
            profilePage: 'commands'
        };

        const binId = await cloudSync.syncProfileData(profileJSON);

        if (binId == null) {
            await twitchChat.sendChatMessage(commandOptions.noCommandsTemplate
                .replace("{username}", event.chatMessage.username), null, "bot");
        } else {
            await twitchChat.sendChatMessage(commandOptions.successTemplate
                .replace("{url}", `https://firebot.app/profile?id=${binId}`), null, "bot"
            );
        }
    }
};