import { DateTime } from "luxon";

import { SystemCommand } from "../../../../types/commands";
import twitchApi from "../../../twitch-api/api";
import chat from "../../twitch-chat";
import util from "../../../utility";

/**
 * The `!followage` command
 */
export const FollowAgeSystemCommand: SystemCommand<{
    displayTemplate: string;
}> = {
    definition: {
        id: "firebot:followage",
        name: "Follow Age",
        active: true,
        trigger: "!followage",
        description: "Displays how long the user has been following the channel.",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        cooldown: {
            user: 0,
            global: 0
        },
        options: {
            displayTemplate: {
                type: "string",
                title: "Output Template",
                description: "How the followage message is formatted",
                tip: "Variables: {user}, {followage}, {followdate}",
                default: `{user} followed {followage} ago on {followdate} UTC`,
                useTextArea: true
            }
        }
    },
    onTriggerEvent: async (event) => {
        const commandSender = event.userCommand.commandSender;
        const commandOptions = event.commandOptions;

        const rawFollowDate = await twitchApi.users.getFollowDateForUser(commandSender);

        if (rawFollowDate === null) {
            await chat.sendChatMessage(`${commandSender} is not following the channel.`);
        } else {
            const followDate = DateTime.fromJSDate(rawFollowDate),
                now = DateTime.utc();

            const followAgeString = util.getDateDiffString(
                followDate.toJSDate(),
                now.toJSDate()
            );

            await chat.sendChatMessage(commandOptions.displayTemplate
                .replace("{user}", commandSender)
                .replace("{followage}", followAgeString)
                .replace("{followdate}", followDate.toFormat("dd MMMM yyyy HH:mm"))
            );
        }
    }
};