"use strict";

const Steam = require("./steam-access");
const twitchChat = require("../../../twitch-chat");
const TwitchApi = require("../../../../twitch-api/api");

const steam = {
    definition: {
        id: "firebot:steam",
        name: "Steam Search",
        active: true,
        trigger: "!steam",
        usage: "[game name]",
        description: "Displays information about a game on steam.",
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
                tip: "Variables: {gameName}, {price}, {releaseDate}, {metaCriticScore}, {steamUrl}",
                default: `{gameName} (Price: {price} - Released: {releaseDate} - Metacritic: {metaCriticScore}) {steamUrl}`,
                useTextArea: true
            }
        }
    },
    onTriggerEvent: async event => {
        const { commandOptions } = event;
        let gameName = event.userCommand.args.join(" ").trim();
        let message = "Couldn't find a Steam game using that name";

        if (gameName == null || gameName.length < 1) {

            const channelData = await TwitchApi.channels.getChannelInformation();

            gameName = channelData && channelData.gameName ? channelData.gameName : "";
        }

        if (gameName != null && gameName !== "") {
            const gameDetails = await Steam.getSteamGameDetails(gameName);

            if (gameDetails !== null) {
                message = commandOptions.outputTemplate
                    .replace("{gameName}", gameDetails.name)
                    .replace("{price}", gameDetails.price || "Unknown")
                    .replace("{releaseDate}", gameDetails.releaseDate || "Unknown")
                    .replace("{metaCriticScore}", gameDetails.score || "Unknown")
                    .replace("{steamUrl}", gameDetails.url);
            }
        }

        await twitchChat.sendChatMessage(message);
    }
};

module.exports = steam;
