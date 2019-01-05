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
        currencyName = currency.name,
        cleanName = currencyName.replace(/\s+/g, '-').toLowerCase(); // lowecase and replace spaces with dash.

    // Define our command.
    const commandManagement = {
        definition: {
            id: "firebot:currency:" + currencyId,
            name: currencyName + " Currency Command",
            active: true,
            trigger: "!" + cleanName,
            description: "Allows management of the \"" + currencyName + "\" currency",
            autoDeleteTrigger: false,
            scanWholeMessage: false,
            currency: {
                name: currencyName,
                id: currencyId
            },
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
                const Chat = require("../common/mixer-chat");

                let triggeredArg = event.userCommand.triggeredArg;
                let args = event.userCommand.args;
                let currencyName = event.command.currency.name;

                // TODO: Create giveall command.
                // TODO: Create removeall command.

                // TODO: Bug with adding and removing points for new users? Is 0 in the DB actually 0 for new people?
                // TODO: Test adding weird parameters for username and points.

                // No args, tell the user how much currency they have.
                if(args.length === 0){
                    currencyDatabase.getUserCurrencyAmount(event.userCommand.commandSender, currencyId).then(function(amount){
                        if(!isNaN(amount)){
                            Chat.smartSend(
                                event.userCommand.commandSender + '\'s ' + currencyName + ' total is ' + amount + '.'
                            );
                        } else {
                            logger.log('Error while trying to show currency amount to user via chat command.');
                        }
                    });
                }

                // Arguments passed, what are we even doing?!?
                switch (triggeredArg) {
                    case "add": {
                        // Get username and make sure our currency amount is a positive integer.
                        let username = args[1],
                        currencyAdjust = Math.abs(parseInt(args[2]));

                        // Adjust currency, it will return true on success and false on failure.
                        currencyDatabase.adjustCurrencyForUser(username, currencyId, currencyAdjust).then(function(status){
                            if(status){
                                Chat.smartSend(
                                    'Added ' +currencyAdjust+ ' ' +currencyName+ ' to ' + username + '.',
                                    event.userCommand.commandSender
                                );
                            } else {
                                // Error removing currency.
                                Chat.smartSend(
                                    `Error: Could not add currency to user.`,
                                    event.userCommand.commandSender
                                );
                                logger.error('Error adding currency for user ('+username+') via chat command. Currency: '+currencyId+'. Value: '+ currencyAdded);
                            }
                        });

                        break;
                    }
                    case "remove": {
                        // Get username and make sure our currency amount is a negative integer.
                        let username = args[1],
                        currencyAdjust = -Math.abs(parseInt(args[2]));

                        // Adjust currency, it will return true on success and false on failure.
                        currencyDatabase.adjustCurrencyForUser(username, currencyId, currencyAdjust).then(function(status){
                            if(status){
                                Chat.smartSend(
                                    'Removed ' +currencyAdjust+ ' ' +currencyName+ ' from ' + username + '.',
                                    event.userCommand.commandSender
                                );
                            } else {
                                // Error removing currency.
                                Chat.smartSend(
                                    `Error: Could not remove currency from user.`,
                                    event.userCommand.commandSender
                                );
                                logger.error('Error removing currency for user ('+username+') via chat command. Currency: '+currencyId+'. Value: '+ currencyAdded);
                            }
                        });

                        break;
                    }
                    case "give": {
                        // Get username and make sure our currency amount is a positive integer.
                        let username = args[1],
                        currencyAdjust = Math.abs(parseInt(args[2])),
                        currencyAdjustNeg = -Math.abs(parseInt(args[2]));

                        // Subtract currency from command user first, then add to new user.
                        currencyDatabase.adjustCurrencyForUser(event.userCommand.commandSender, currencyId, currencyAdjustNeg).then(function(status){
                            if(status){
                                // Okay, we subtracted... now add to new user.
                                currencyDatabase.adjustCurrencyForUser(username, currencyId, currencyAdjust).then(function(status){
                                    if(status){
                                        Chat.smartSend(
                                            'Gave ' +currencyAdjust+ ' ' +currencyName+ ' to ' + username + '.',
                                            event.userCommand.commandSender
                                        );
                                    } else {
                                        // Error removing currency.
                                        Chat.smartSend(
                                            `Error: Could not add currency to user during give transaction.`,
                                            event.userCommand.commandSender
                                        );
                                        logger.error('Error adding currency during give transaction for user ('+username+') via chat command. Currency: '+currencyId+'. Value: '+ currencyAdded);
                                    }
                                });
                            } else {
                                // Error removing currency.
                                Chat.smartSend(
                                    `Error: Could not remove currency to user during give transaction.`,
                                    event.userCommand.commandSender
                                );
                                logger.error('Error removing currency during give transaction for user ('+username+') via chat command. Currency: '+currencyId+'. Value: '+ currencyAdded);
                            }
                        });
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

/**
 * Loops through all currencies we have and passes them to refresh currency commands.
 * This lets us create all of our currency commands when the application is started.
 */
function createAllCurrencyCommands(){
    logger.log('Creating all currency commands.');
    let currencyData = currencyDatabase.getCurrencies();

    Object.values(currencyData).forEach(currency => {
        refreshCurrencyCommands('create', currency);
    });
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
exports.createAllCurrencyCommands = createAllCurrencyCommands;