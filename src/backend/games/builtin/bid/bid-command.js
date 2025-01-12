"use strict";

const util = require("../../../utility");
const twitchChat = require("../../../chat/twitch-chat");
const commandManager = require("../../../chat/commands/command-manager");
const gameManager = require("../../game-manager");
const currencyAccess = require("../../../currency/currency-access").default;
const currencyManager = require("../../../currency/currency-manager");
const moment = require("moment");
const NodeCache = require("node-cache");

let activeBiddingInfo = {
    "active": false,
    "currentBid": 0,
    "topBidder": "",
    "topBidderDisplayName": ""
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

async function stopBidding(chatter) {
    clearTimeout(bidTimer);
    if (activeBiddingInfo.topBidder) {
        await twitchChat.sendChatMessage(`${activeBiddingInfo.topBidderDisplayName} has won the bidding with ${activeBiddingInfo.currentBid}!`, null, chatter);
    } else {
        await twitchChat.sendChatMessage(`There is no winner, because no one bid!`, null, chatter);
    }

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
                                "broadcaster",
                                "mod"
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
                                "broadcaster",
                                "mod"
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
    onTriggerEvent: async (event) => {
        const { chatMessage, userCommand } = event;

        const bidSettings = gameManager.getGameSettings("firebot-bid");
        const chatter = bidSettings.settings.chatSettings.chatter;

        const currencyId = bidSettings.settings.currencySettings.currencyId;
        const currency = currencyAccess.getCurrencyById(currencyId);
        const currencyName = currency.name;

        if (event.userCommand.subcommandId === "bidStart") {
            const triggeredArg = userCommand.args[1];
            const bidAmount = parseInt(triggeredArg);

            if (isNaN(bidAmount)) {
                await twitchChat.sendChatMessage(`Invalid amount. Please enter a number to start bidding.`, null, chatter, chatMessage.id);
                return;
            }

            if (activeBiddingInfo.active !== false) {
                await twitchChat.sendChatMessage(`There is already a bid running. Use !bid stop to stop it.`, null, chatter, chatMessage.id);
                return;
            }

            if (bidAmount < bidSettings.settings.currencySettings.minBid) {
                await twitchChat.sendChatMessage(`The opening bid must be more than ${bidSettings.settings.currencySettings.minBid}.`, null, chatter, chatMessage.id);
                return;
            }

            activeBiddingInfo = {
                "active": true,
                "currentBid": bidAmount,
                "topBidder": ""
            };

            const raiseMinimum = bidSettings.settings.currencySettings.minIncrement;
            const minimumBidWithRaise = activeBiddingInfo.currentBid + raiseMinimum;
            await twitchChat.sendChatMessage(`Bidding has started at ${bidAmount} ${currencyName}. Type !bid ${minimumBidWithRaise} to start bidding.`, null, chatter);

            const timeLimit = bidSettings.settings.timeSettings.timeLimit * 60000;
            bidTimer = setTimeout(async () => {
                await stopBidding(chatter);
            }, timeLimit);

        } else if (event.userCommand.subcommandId === "bidStop") {
            await stopBidding(chatter);
        } else if (event.userCommand.subcommandId === "bidAmount") {

            const triggeredArg = userCommand.args[0];
            const bidAmount = parseInt(triggeredArg);
            const username = userCommand.commandSender;
            const userDisplayName = chatMessage?.userDisplayName ?? username;

            if (activeBiddingInfo.active === false) {
                await twitchChat.sendChatMessage(`There is no active bidding in progress.`, null, chatter, chatMessage.id);
                return;
            }

            const cooldownExpireTime = cooldownCache.get(username);
            if (cooldownExpireTime && moment().isBefore(cooldownExpireTime)) {
                const timeRemainingDisplay = util.secondsForHumans(Math.abs(moment().diff(cooldownExpireTime, 'seconds')));
                await twitchChat.sendChatMessage(`You placed a bid recently! Please wait ${timeRemainingDisplay} before placing another bid.`, null, chatter, chatMessage.id);
                return;
            }

            if (activeBiddingInfo.topBidder === username) {
                await twitchChat.sendChatMessage("You are already the top bidder. You can't bid against yourself.", null, chatter, chatMessage.id);
                return;
            }

            if (bidAmount < 1) {
                await twitchChat.sendChatMessage("Bid amount must be more than 0.", null, chatter, chatMessage.id);
                return;
            }

            const minBid = bidSettings.settings.currencySettings.minBid;
            if (minBid != null && minBid > 0) {
                if (bidAmount < minBid) {
                    await twitchChat.sendChatMessage(`Bid amount must be at least ${minBid} ${currencyName}.`, null, chatter, chatMessage.id);
                    return;
                }
            }

            const userBalance = await currencyManager.getViewerCurrencyAmount(username, currencyId);
            if (userBalance < bidAmount) {
                await twitchChat.sendChatMessage(`You don't have enough ${currencyName}!`, null, chatter, chatMessage.id);
                return;
            }

            const raiseMinimum = bidSettings.settings.currencySettings.minIncrement;
            const minimumBidWithRaise = activeBiddingInfo.currentBid + raiseMinimum;
            if (bidAmount < minimumBidWithRaise) {
                await twitchChat.sendChatMessage(`You must bid at least ${minimumBidWithRaise} ${currencyName}.`, null, chatter, chatMessage.id);
                return;
            }

            const previousHighBidder = activeBiddingInfo.topBidder;
            const previousHighBidAmount = activeBiddingInfo.currentBid;
            if (previousHighBidder != null && previousHighBidder !== "") {
                await currencyManager.adjustCurrencyForViewer(previousHighBidder, currencyId, previousHighBidAmount);
                await twitchChat.sendChatMessage(`You have been out bid! You've been refunded ${previousHighBidAmount} ${currencyName}.`, null, chatter, chatMessage.id);
            }

            await currencyManager.adjustCurrencyForViewer(username, currencyId, -Math.abs(bidAmount));
            const newTopBidWithRaise = bidAmount + raiseMinimum;
            await twitchChat.sendChatMessage(`${userDisplayName} is the new high bidder at ${bidAmount} ${currencyName}. To bid, type !bid ${newTopBidWithRaise} (or higher).`);

            // eslint-disable-next-line no-use-before-define
            setNewHighBidder(username, userDisplayName, bidAmount);

            const cooldownSecs = bidSettings.settings.cooldownSettings.cooldown;
            if (cooldownSecs && cooldownSecs > 0) {
                const expireTime = moment().add(cooldownSecs, 'seconds');
                cooldownCache.set(username, expireTime, cooldownSecs);
            }
        } else {
            await twitchChat.sendChatMessage(`Incorrect bid usage: ${userCommand.trigger} [bidAmount]`, null, chatter, chatMessage.id);
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

function setNewHighBidder(username, userDisplayName, amount) {
    activeBiddingInfo.currentBid = amount;
    activeBiddingInfo.topBidder = username;
    activeBiddingInfo.topBidderDisplayName = userDisplayName;
}

exports.purgeCaches = purgeCaches;
exports.registerBidCommand = registerBidCommand;
exports.unregisterBidCommand = unregisterBidCommand;