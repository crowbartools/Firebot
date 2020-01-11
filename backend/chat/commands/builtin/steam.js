"use strict";

const Chat = require("../../../common/mixer-chat");
const Steam = require("../../../data-access/steam-access");

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
    onTriggerEvent: event => {
        return new Promise(async resolve => {
            let gameName = event.userCommand.args.join(" ");
            let gameDetails = await Steam.getSteamGameDetails(gameName);

            let message = "";
            if (gameDetails == null) {
                message = "Couldn't find a Steam game using that name!";
            } else {
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

            Chat.smartSend(message);

            resolve();
        });
    }
};

module.exports = steam;
