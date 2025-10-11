import { SystemCommand } from "../../../../../types/commands";
import Steam from "./steam-access";
import { TwitchApi } from "../../../../streaming-platforms/twitch/api";

/**
 * The `!steam` command
 */
export const SteamSystemCommand: SystemCommand<{
    outputTemplate: string;
    countryCode: string;
}> = {
    definition: {
        id: "firebot:steam",
        name: "Steam Search",
        active: true,
        trigger: "!steam",
        usage: "[game name]",
        description: "Displays information about a game on Steam.",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        cooldown: {
            user: 0,
            global: 5
        },
        options: {
            outputTemplate: {
                type: "string",
                title: "Output Template",
                tip: "Variables: {gameName}, {price}, {releaseDate}, {metaCriticScore}, {steamUrl}, {steamShortDescription}",
                default: `{gameName} (Price: {price} - Released: {releaseDate} - Metacritic: {metaCriticScore}) {steamUrl}`,
                useTextArea: true
            },
            countryCode: {
                type: "string",
                title: "Country Code (Optional)",
                tip: "A two-letter ISO-3166 country code. Examples: US, CA, SE, NO",
                default: ""
            }
        }
    },
    onTriggerEvent: async (event) => {
        const { commandOptions } = event;
        let gameName = event.userCommand.args.join(" ").trim();
        let message = "Couldn't find a Steam game using that name";

        if (gameName == null || gameName.length < 1) {

            const channelData = await TwitchApi.channels.getChannelInformation();

            gameName = channelData && channelData.gameName ? channelData.gameName : "";
        }

        if (gameName != null && gameName !== "") {
            const gameDetails = await Steam.getSteamGameDetails(gameName, commandOptions.countryCode);

            if (gameDetails !== null) {
                message = commandOptions.outputTemplate
                    .replaceAll("{gameName}", gameDetails.name)
                    .replaceAll("{price}", gameDetails.price || "Unknown")
                    .replaceAll("{releaseDate}", gameDetails.releaseDate || "Unknown")
                    .replaceAll("{metaCriticScore}", gameDetails.score?.toString() || "Unknown")
                    .replaceAll("{steamUrl}", gameDetails.url)
                    .replaceAll("{steamShortDescription}", gameDetails.shortDescription || "Unknown");
            }
        }

        await TwitchApi.chat.sendChatMessage(message, null, true);
    }
};