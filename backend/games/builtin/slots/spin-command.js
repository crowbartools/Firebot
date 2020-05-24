"use strict";

const chat = require("../../../common/mixer-chat");
const gameManager = require("../../game-manager");
const currencyDatabase = require("../../../database/currencyDatabase");
const slotMachine = require("./slot-machine");

const spinCommand = {
    definition: {
        id: "firebot:spin",
        name: "Spin (Slots)",
        active: true,
        trigger: "!spin",
        description: "Allows viewers to play the Slots game.",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        hideCooldowns: true,
        subCommands: [
            {
                id: "spinAmount",
                arg: "\\d+",
                regex: true,
                usage: "[currencyAmount]",
                description: "Spins the slot machine with the given amount"
            }
        ]
    },
    onTriggerEvent: async event => {

        const { userCommand } = event;

        if (event.userCommand.subcommandId === "spinAmount") {

            const triggeredArg = userCommand.args[0];
            const currencyAmount = parseInt(triggeredArg);

            const username = userCommand.commandSender;

            const slotsSettings = gameManager.getGameSettings("firebot-slots");

            if (currencyAmount < 1) {
                chat.smartSend("Currency amount must be more than 0.", username);
                return;
            }

            const userBalance = await currencyDatabase.getUserCurrencyAmount(username, slotsSettings.settings.main.currencyId);
            if (userBalance < currencyAmount) {
                chat.smartSend("You don't have enough to wager this amount!", username);
                return;
            }


        }

    }
};


function registerSpinCommand() {

}

function unregisterSpinCommand() {

}