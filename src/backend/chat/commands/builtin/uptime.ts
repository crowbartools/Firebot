import { SystemCommand } from "../../../../types/commands";
import util from "../../../utility";
import chat from "../../twitch-chat";

/**
 * The `!uptime` command
 */
export const UptimeSystemCommand: SystemCommand<{
    uptimeDisplayTemplate: string;
}> = {
    definition: {
        id: "firebot:uptime",
        name: "Uptime",
        active: true,
        trigger: "!uptime",
        description: "Displays how long the stream has been live in chat.",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        cooldown: {
            user: 0,
            global: 0
        },
        options: {
            uptimeDisplayTemplate: {
                type: "string",
                title: "Output Template",
                description: "How the uptime message is formatted",
                tip: "Variables: {uptime}",
                default: `Broadcasting time: {uptime}`,
                useTextArea: true
            }
        }
    },
    onTriggerEvent: async (event) => {
        const uptimeString = await util.getUptime();
        const { commandOptions } = event;
        await chat.sendChatMessage(commandOptions.uptimeDisplayTemplate
            .replace("{uptime}", uptimeString));
    }
};