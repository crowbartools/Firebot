import { DateTime } from "luxon";

import { SystemCommand } from "../../../../types/commands";
import { TwitchApi } from "../../../streaming-platforms/twitch/api";
import { getDateDiffString } from "../../../utils";

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

        const rawFollowDate = await TwitchApi.users.getFollowDateForUser(commandSender);

        if (rawFollowDate === null) {
            await TwitchApi.chat.sendChatMessage(`${commandSender} is not following the channel.`, null, true);
        } else {
            const followDate = DateTime.fromJSDate(rawFollowDate),
                now = DateTime.utc();

            const followAgeString = getDateDiffString(
                followDate.toJSDate(),
                now.toJSDate()
            );

            await TwitchApi.chat.sendChatMessage(
                commandOptions.displayTemplate
                    .replaceAll("{user}", commandSender)
                    .replaceAll("{followage}", followAgeString)
                    .replaceAll("{followdate}", followDate.toFormat("dd MMMM yyyy HH:mm")),
                null,
                true
            );
        }
    }
};