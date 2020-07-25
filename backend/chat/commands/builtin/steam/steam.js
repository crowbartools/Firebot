"use strict";

const Steam = require("./steam-access");
const accountAccess = require("../../../../common/account-access");
const twitchChat = require("../../../twitch-chat");
const twitchApi = require('../../../../twitch-api/client');

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
        }
    },
    onTriggerEvent: async event => {
        let gameName = event.userCommand.args.join(" ").trim();
        let message = "Couldn't find a Steam game using that name!";

        if (gameName == null || gameName.length < 1) {
            const client = twitchApi.getClient();
            const channelData = await client.kraken.channels.getMyChannel();
            const gameInfo = channelData.game;

            gameName = gameInfo.name != null ? gameInfo.name : "";
        }

        if (gameName != null && gameName !== "") {
            let gameDetails = await Steam.getSteamGameDetails(gameName);

            if (gameDetails !== null) {
                let details = [];
                if (gameDetails.price) {
                    details.push(`Price: ${gameDetails.price}`);
                }
                if (gameDetails.releaseDate) {
                    details.push(`Released: ${gameDetails.releaseDate}`);
                }
                if (gameDetails.score) {
                    details.push(`Metacritic: ${gameDetails.score}`);
                }
                let detailString = details.length > 0 ? `(${details.join(" - ")})` : "";

                message = `${gameDetails.name} ${detailString} ${gameDetails.url}`;
            }
        }

        twitchChat.sendChatMessage(message);
    }
};

module.exports = steam;
