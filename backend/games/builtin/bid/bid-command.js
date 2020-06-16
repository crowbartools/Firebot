"use strict";

const util = require("../../../utility");
const chat = require("../../../chat/chat");
const commandManager = require("../../../chat/commands/CommandManager");
const gameManager = require("../../game-manager");
const currencyDatabase = require("../../../database/currencyDatabase");
const moment = require("moment");
const NodeCache = require("node-cache");

let activeBiddingInfo = {
    "active": false,
    "currentBid": 0,
    "topBidder": ""
};
let bidTimer;
const cooldownCache = new NodeCache({checkperiod: 5});
const BID_COMMAND_ID = "firebot:bid";

function purgeCaches() {
    cooldownCache.flushAll();
    activeBiddingInfo = {
        "active": false,
        "currentBid": 0,
        "topBidder": ""
    };
}

function stopBidding(chatter) {
    clearTimeout(bidTimer);
    chat.sendChatMessage(`${activeBiddingInfo.topBidder} has won the bidding with ${activeBiddingInfo.currentBid}!`, null, chatter);
    purgeCaches();
}

const bidCommand = {
    definition: {
        id: BID_COMMAND_ID,
        name: "Bid",
        active: true,
        trigger: "!bid",
        description: "Allows viewers to participate in the Bid game.",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        hideCooldowns: true,
        subCommands: [
            {
                id: "bidStart",
                arg: "start",
                usage: "start [currencyAmount]",
                description: "Starts the bidding at the given amount.",
                hideCooldowns: true,
                restrictionData: {
                    restrictions: [
                        {
                            id: "sys-cmd-mods-only-perms",
                            type: "firebot:permissions",
                            mode: "roles",
                            roleIds: [
                                "Mod",
                                "ChannelEditor",
                                "Owner"
                            ]
                        }
                    ]
                }
            },
            {
                id: "bidStop",
                arg: "stop",
                usage: "stop",
                description: "Manually stops the bidding. Highest bidder wins.",
                hideCooldowns: true,
                restrictionData: {
                    restrictions: [
                        {
                            id: "sys-cmd-mods-only-perms",
                            type: "firebot:permissions",
                            mode: "roles",
                            roleIds: [
                                "Mod",
                                "ChannelEditor",
                                "Owner"
                            ]
                        }
                    ]
                }
            },
            {
                id: "bidAmount",
                arg: "\\d+",
                regex: true,
                usage: "[currencyAmount]",
                description: "Joins the bidding at the given amount.",
                hideCooldowns: true
            }
        ]
    },
    onTriggerEvent: async event => {
        const { chatEvent, userCommand } = event;

        const bidSettings = gameManager.getGameSettings("firebot-bid");
        const chatter = bidSettings.settings.chatSettings.chatter;

        const currencyId = bidSettings.settings.currencySettings.currencyId;
        const currency = currencyDatabase.getCurrencyById(currencyId);
        const currencyName = currency.name;

        if (event.userCommand.subcommandId === "bidStart") {
            const triggeredArg = userCommand.args[1];
            const bidAmount = parseInt(triggeredArg);
            const username = userCommand.commandSender;

            if (isNaN(bidAmount)) {
                chat.sendChatMessage(`Invalid amount. Please enter a number to start bidding.`, username, chatter);
                chat.deleteMessage(chatEvent.id);
                return;
            }

            if (activeBiddingInfo.active !== false) {
                chat.sendChatMessage(`There is already a bid running. Use !bid stop to stop it.`, username, chatter);
                chat.deleteMessage(chatEvent.id);
                return;
            }

            if (bidAmount < bidSettings.settings.currencySettings.minBid) {
                chat.sendChatMessage(`The opening bid must be more than ${bidSettings.settings.currencySettings.minBid}.`, username, chatter);
                chat.deleteMessage(chatEvent.id);
                return;
            }

            activeBiddingInfo = {
                "active": true,
                "currentBid": bidAmount,
                "topBidder": ""
            };

            let raiseMinimum = bidSettings.settings.currencySettings.minIncrement;
            let minimumBidWithRaise = activeBiddingInfo.currentBid + raiseMinimum;
            chat.sendChatMessage(`Bidding has started at ${bidAmount} ${currencyName}. Type !bid ${minimumBidWithRaise} to start bidding.`, null, chatter);

            let timeLimit = bidSettings.settings.timeSettings.timeLimit * 60000;
            bidTimer = setTimeout(function() {
                stopBidding(chatter);
            }, timeLimit);

        } else if (event.userCommand.subcommandId === "bidStop") {
            stopBidding(chatter);
        } else if (event.userCommand.subcommandId === "bidAmount") {

            const triggeredArg = userCommand.args[0];
            const bidAmount = parseInt(triggeredArg);
            const username = userCommand.commandSender;

            if (activeBiddingInfo.active === false) {
                chat.sendChatMessage(`There is no active bidding in progress.`, username, chatter);
                chat.deleteMessage(chatEvent.id);
                return;
            }

            let cooldownExpireTime = cooldownCache.get(username);
            if (cooldownExpireTime && moment().isBefore(cooldownExpireTime)) {
                const timeRemainingDisplay = util.secondsForHumans(Math.abs(moment().diff(cooldownExpireTime, 'seconds')));
                chat.sendChatMessage(`You placed a bid recently! Please wait ${timeRemainingDisplay} before placing another bid.`, username, chatter);
                chat.deleteMessage(chatEvent.id);
                return;
            }

            if (activeBiddingInfo.topBidder === username) {
                chat.sendChatMessage("You are already the top bidder. You can't bid against yourself.", username, chatter);
                chat.deleteMessage(chatEvent.id);
                return;
            }

            if (bidAmount < 1) {
                chat.sendChatMessage("Bid amount must be more than 0.", username, chatter);
                chat.deleteMessage(chatEvent.id);
                return;
            }

            const minBid = bidSettings.settings.currencySettings.minBid;
            if (minBid != null & minBid > 0) {
                if (bidAmount < minBid) {
                    chat.sendChatMessage(`Bid amount must be at least ${minBid} ${currencyName}.`, username, chatter);
                    chat.deleteMessage(chatEvent.id);
                    return;
                }
            }

            const userBalance = await currencyDatabase.getUserCurrencyAmount(username, currencyId);
            if (userBalance < bidAmount) {
                chat.sendChatMessage(`You don't have enough ${currencyName}!`, username, chatter);
                chat.deleteMessage(chatEvent.id);
                return;
            }

            let raiseMinimum = bidSettings.settings.currencySettings.minIncrement;
            let minimumBidWithRaise = activeBiddingInfo.currentBid + raiseMinimum;
            if (bidAmount < minimumBidWithRaise) {
                chat.sendChatMessage(`You must bid at least ${minimumBidWithRaise} ${currencyName}.`, username, chatter);
                chat.deleteMessage(chatEvent.id);
                return;
            }

            let previousHighBidder = activeBiddingInfo.topBidder;
            let previousHighBidAmount = activeBiddingInfo.currentBid;
            if (previousHighBidder != null && previousHighBidder !== "") {
                await currencyDatabase.adjustCurrencyForUser(previousHighBidder, currencyId, previousHighBidAmount);
                chat.sendChatMessage(`You have been out bid! You've been refunded ${previousHighBidAmount} ${currencyName}.`, previousHighBidder, chatter);
            }

            await currencyDatabase.adjustCurrencyForUser(username, currencyId, -Math.abs(bidAmount));
            let newTopBidWithRaise = bidAmount + raiseMinimum;
            chat.sendChatMessage(`${username} is the new high bidder at ${bidAmount} ${currencyName}. To bid, type !bid ${newTopBidWithRaise} (or higher).`);

            // eslint-disable-next-line no-use-before-define
            setNewHighBidder(username, bidAmount);

            let cooldownSecs = bidSettings.settings.cooldownSettings.cooldown;
            if (cooldownSecs && cooldownSecs > 0) {
                const expireTime = moment().add(cooldownSecs, 'seconds');
                cooldownCache.set(username, expireTime, cooldownSecs);
            }
        } else {
            chat.sendChatMessage(`Incorrect bid usage: ${userCommand.trigger} [bidAmount]`, userCommand.commandSender, chatter);
            chat.deleteMessage(chatEvent.id);
        }
    }
};

function registerBidCommand() {
    if (!commandManager.hasSystemCommand(BID_COMMAND_ID)) {
        commandManager.registerSystemCommand(bidCommand);
    }
}

function unregisterBidCommand() {
    commandManager.unregisterSystemCommand(BID_COMMAND_ID);
}

function setNewHighBidder(username, amount) {
    activeBiddingInfo.currentBid = amount;
    activeBiddingInfo.topBidder = username;
}

exports.purgeCaches = purgeCaches;
exports.registerBidCommand = registerBidCommand;
exports.unregisterbidCommand = unregisterBidCommand;