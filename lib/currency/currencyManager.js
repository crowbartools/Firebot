"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const currencyDatabase = require("../database/currencyDatabase");
const CommandManager = require("../chat/commands/CommandManager");
const moment = require("moment");

let currencyInterval = null;

// This file manages the currency payout intervals.
// For manipulating currency check out /database/currencyDatabase.js

// This is run when the interval fires for currencies.
function applyCurrency() {
    logger.debug("Running currency timer...");

    let currencyData = currencyDatabase.getCurrencies();

    Object.values(currencyData).forEach(currency => {
        let currentMinutes = moment().minutes();
        let intervalMod = currentMinutes % currency.interval;
        if (intervalMod === 0 && currency.active) {
            // do payout
            logger.debug(
                "Paying out currency " + currency.name + " amount " + currency.payout
            );
            currencyDatabase.addCurrencyToOnlineUsers(currency.id, currency.payout);
        } else {
            logger.debug(
                `${
                currency.name
                } isnt ready to payout yet or currency is set to inactive.`
            );
        }
    });
}

// This will stop our currency timers.
function stopTimer() {
    logger.debug("Clearing previous currency intervals");
    if (currencyInterval != null) {
        clearInterval(currencyInterval);
        currencyInterval = null;
    }
}

// Start up our currency timers at the next full minute mark.
// Then we'll check all of our currencies each minute to see if any need to be applied.
function startTimer() {
    stopTimer();
    let currentTime = moment();
    let nextMinute = moment()
        .endOf("minute")
        .add(1, "s");
    let diff = nextMinute.diff(currentTime, "seconds");

    logger.debug(`Currency timer will start in ${diff} seconds`);

    setTimeout(() => {
        logger.debug("Starting currency timer.");
        //start timer, fire interval every minute.
        currencyInterval = setInterval(() => {
            applyCurrency();
        }, 60000);
    }, diff * 1000);
}

/**
 * Creates a command definition when given a currency name.
 * @param {*} currencyName 
 */
function createCurrencyCommandDefinition(currency) {
    let currencyId = currency.id,
        currencyName = currency.name;

    // Define our command.
    const commandManagement = {
        definition: {
            id: "firebot:currency:" + currencyId,
            name: currencyName + " Currency Command",
            active: true,
            trigger: "!" + currencyName,
            description: "Allows management of the \"" + currencyName + "\" currency",
            autoDeleteTrigger: false,
            scanWholeMessage: false,
            cooldown: {
                user: 0,
                global: 0
            },
            permission: {},
            subCommands: [
                {
                    arg: "add",
                    usage: "add [@user] [amount]",
                    description: "Adds currency for a given user.",
                    permission: {
                        type: "group",
                        groups: ["Moderators", "Channel Editors", "Streamer"]
                    }
                },
                {
                    arg: "remove",
                    usage: "remove [@user] [amount]",
                    description: "Removes currency for a given user.",
                    permission: {
                        type: "group",
                        groups: ["Moderators", "Channel Editors", "Streamer"]
                    }
                },
                {
                    arg: "give",
                    usage: "give [@user] [amount]",
                    description: "Gives currency from one user to another user.",
                    permission: {
                        type: "group",
                        groups: ["Moderators", "Channel Editors", "Streamer"]
                    }
                }
            ]
        },
        /**
           * When the command is triggered
           */
        onTriggerEvent: event => {
            return new Promise(async (resolve) => {
                const Chat = require("../../../common/mixer-chat");

                let triggeredArg = event.userCommand.triggeredArg;

                switch (triggeredArg) {
                    case "add": {
                        //do logic for add subcommand

                        break;
                    }
                    case "remove": {

                        break;
                    }
                    case "give": {

                        break;
                    }
                    default: {
                        Chat.smartSend(
                            `Invalid command. Usage: ${event.command.trigger} ${usage}`,
                            event.userCommand.commandSender
                        );
                    }
                }

                resolve();
            });
        }
    }

    return commandManagement;
}

/**
 * Makes sure our currency system commands are up to date.
 * @param {*} currency - The currency object that was saved.
 * @param {*} action - Update, Create, or Delete
 */
function refreshCurrencyCommands(action = false, currency = false) {
    // If we don't get currency stop here.
    if (currency === false) { 
        logger.error('Invalid currency passed to refresh currency commands.');
        return; 
    }

    // Log our action for logger.
    logger.debug('Currency "'+currency.name+'" action "'+action+'" triggered. Updating currency system commands.');

    // Decide what we want to do based on the action that was passed to us.
    switch(action){
        case "update":
            // TODO: This is broken right now and won't actually update.
            // Need to take currency id and look for firebot:currency:currencyId in
            // system commands and then update.

            CommandManager.unregisterSystemCommand("firebot:currency:"+currency.id);
            CommandManager.registerSystemCommand(
                createCurrencyCommandDefinition(currency)
            );
        break;
        case "delete":
            // Delete the system command for this currency.
            CommandManager.unregisterSystemCommand("firebot:currency:"+currency.id);
        break;
        case "create":
            // Build a new system command def and register it.
            CommandManager.registerSystemCommand(
                createCurrencyCommandDefinition(currency)
            );
        break;
        default:
            logger.error('Invalid action passed to refresh currency commands.');
        return;
    }
}

// Refresh our currency commands.
ipcMain.on("refreshCurrencyCommands", (event, data) => {
    refreshCurrencyCommands(data.action, data.currency);
});

// Start up our currency timers.
// Also fired in currencyDatabase.js.
ipcMain.on("refreshCurrencyCache", () => {
    startTimer();
});

exports.startTimer = startTimer;
exports.stopTimer = stopTimer;
