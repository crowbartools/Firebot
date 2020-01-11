"use strict";

const Chat = require("../../../common/mixer-chat");
const Steam = require("../../../data-access/steam-access");

/**
 * The Uptime command
 */
const steam = {
    definition: {
        id: "firebot:steam",
        name: "Steam",
        active: true,
        trigger: "!steam",
        usage: "[game name]",
        description: "Displays information about a game on steam.",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        cooldown: {
            user: 0,
            global: 0
        }
    },
    /**
   * When the command is triggered
   */
    onTriggerEvent: event => {
        return new Promise(async (resolve, reject) => {
            let args = event.userCommand.args;
            let gameName = args.join(" ");
            let gameDetails = await Steam.getSteamGameDetails(gameName);

            if (gameDetails !== false) {
                Chat.smartSend(gameDetails.name + " (Price: " + gameDetails.price + " - Release: " + gameDetails.releaseDate + " - Metacritic: " + gameDetails.score + ") - " + gameDetails.url);
                return resolve();
            }

            Chat.smartSend("Couldn't find a Steam game using that name!");
            return resolve();
        });
    }
};

module.exports = steam;
