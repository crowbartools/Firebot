"use strict";

const Steam = require("./steam-access");
const twitchChat = require("../../../twitch-chat");
const twitchChannels = require("../../../../twitch-api/resource/channels");

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

            const channelData = await twitchChannels.getChannelInformation();

            gameName = channelData && channelData.gameName ? channelData.gameName : "";
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
