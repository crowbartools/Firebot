"use strict";

const util = require("../../../utility");
const commandManager = require("../../../chat/commands/command-manager");
const gameManager = require("../../game-manager");
const currencyAccess = require("../../../currency/currency-access").default;
const currencyManager = require("../../../currency/currency-manager");
const moment = require("moment");
const NodeCache = require("node-cache");
const { TwitchApi } = require("../../../streaming-platforms/twitch/api");

let activeBiddingInfo = {
    "active": false,
    "currentBid": 0,
    "topBidder": "",
    "topBidderDisplayName": ""
};
let bidTimer;
const cooldownCache = new NodeCache({ checkperiod: 5 });
const BID_COMMAND_ID = "firebot:bid";

function purgeCaches() {
    cooldownCache.flushAll();
    activeBiddingInfo = {
        "active": false,
        "currentBid": 0,
        "topBidder": ""
    };
}

function setNewHighBidder(username, userDisplayName, amount) {
    activeBiddingInfo.currentBid = amount;
    activeBiddingInfo.topBidder = username;
    activeBiddingInfo.topBidderDisplayName = userDisplayName;
}

async function stopBidding(chatter) {
    clearTimeout(bidTimer);
    const sendAsBot = !chatter || chatter.toLowerCase() === "bot";
    if (activeBiddingInfo.topBidder) {
        await TwitchApi.chat.sendChatMessage(
            `${activeBiddingInfo.topBidderDisplayName} has won the bidding with ${activeBiddingInfo.currentBid}!`,
            null,
            sendAsBot
        );
    } else {
        await TwitchApi.chat.sendChatMessage(
            `There is no winner, because no one bid!`,
            null,
            sendAsBot
        );
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
        const sendAsBot = !chatter || chatter.toLowerCase() === "bot";

        const currencyId = bidSettings.settings.currencySettings.currencyId;
        const currency = currencyAccess.getCurrencyById(currencyId);
        const currencyName = currency.name;

        if (event.userCommand.subcommandId === "bidStart") {
            const triggeredArg = userCommand.args[1];
            const bidAmount = parseInt(triggeredArg);

            if (isNaN(bidAmount)) {
                await TwitchApi.chat.sendChatMessage(
                    `Invalid amount. Please enter a number to start bidding.`,
                    chatMessage.id,
                    sendAsBot
                );
                return;
            }

            if (activeBiddingInfo.active !== false) {
                await TwitchApi.chat.sendChatMessage(
                    `There is already a bid running. Use !bid stop to stop it.`,
                    chatMessage.id,
                    sendAsBot
                );
                return;
            }

            if (bidAmount < bidSettings.settings.currencySettings.minBid) {
                await TwitchApi.chat.sendChatMessage(
                    `The opening bid must be more than ${bidSettings.settings.currencySettings.minBid}.`,
                    chatMessage.id,
                    sendAsBot
                );
                return;
            }

            activeBiddingInfo = {
                "active": true,
                "currentBid": bidAmount,
                "topBidder": ""
            };

            const raiseMinimum = bidSettings.settings.currencySettings.minIncrement;
            const minimumBidWithRaise = activeBiddingInfo.currentBid + raiseMinimum;
            await TwitchApi.chat.sendChatMessage(
                `Bidding has started at ${bidAmount} ${currencyName}. Type !bid ${minimumBidWithRaise} to start bidding.`,
                null,
                sendAsBot
            );

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
                await TwitchApi.chat.sendChatMessage(
                    `There is no active bidding in progress.`,
                    chatMessage.id,
                    sendAsBot
                );
                return;
            }

            const cooldownExpireTime = cooldownCache.get(username);
            if (cooldownExpireTime && moment().isBefore(cooldownExpireTime)) {
                const timeRemainingDisplay = util.secondsForHumans(Math.abs(moment().diff(cooldownExpireTime, 'seconds')));
                await TwitchApi.chat.sendChatMessage(
                    `You placed a bid recently! Please wait ${timeRemainingDisplay} before placing another bid.`,
                    chatMessage.id,
                    sendAsBot
                );
                return;
            }

            if (activeBiddingInfo.topBidder === username) {
                await TwitchApi.chat.sendChatMessage(
                    "You are already the top bidder. You can't bid against yourself.",
                    chatMessage.id,
                    sendAsBot
                );
                return;
            }

            if (bidAmount < 1) {
                await TwitchApi.chat.sendChatMessage(
                    "Bid amount must be more than 0.",
                    chatMessage.id,
                    sendAsBot
                );
                return;
            }

            const minBid = bidSettings.settings.currencySettings.minBid;
            if (minBid != null && minBid > 0) {
                if (bidAmount < minBid) {
                    await TwitchApi.chat.sendChatMessage(
                        `Bid amount must be at least ${minBid} ${currencyName}.`,
                        chatMessage.id,
                        sendAsBot
                    );
                    return;
                }
            }

            const userBalance = await currencyManager.getViewerCurrencyAmount(username, currencyId);
            if (userBalance < bidAmount) {
                await TwitchApi.chat.sendChatMessage(
                    `You don't have enough ${currencyName}!`,
                    chatMessage.id,
                    sendAsBot
                );
                return;
            }

            const raiseMinimum = bidSettings.settings.currencySettings.minIncrement;
            const minimumBidWithRaise = activeBiddingInfo.currentBid + raiseMinimum;
            if (bidAmount < minimumBidWithRaise) {
                await TwitchApi.chat.sendChatMessage(
                    `You must bid at least ${minimumBidWithRaise} ${currencyName}.`,
                    chatMessage.id,
                    sendAsBot
                );
                return;
            }

            const previousHighBidder = activeBiddingInfo.topBidder;
            const previousHighBidAmount = activeBiddingInfo.currentBid;
            if (previousHighBidder != null && previousHighBidder !== "") {
                await currencyManager.adjustCurrencyForViewer(previousHighBidder, currencyId, previousHighBidAmount);
                await TwitchApi.chat.sendChatMessage(
                    `You have been out bid! You've been refunded ${previousHighBidAmount} ${currencyName}.`,
                    chatMessage.id,
                    sendAsBot
                );
            }

            await currencyManager.adjustCurrencyForViewer(username, currencyId, -Math.abs(bidAmount));
            const newTopBidWithRaise = bidAmount + raiseMinimum;
            await TwitchApi.chat.sendChatMessage(
                `${userDisplayName} is the new high bidder at ${bidAmount} ${currencyName}. To bid, type !bid ${newTopBidWithRaise} (or higher).`,
                null,
                sendAsBot
            );


            setNewHighBidder(username, userDisplayName, bidAmount);

            const cooldownSecs = bidSettings.settings.cooldownSettings.cooldown;
            if (cooldownSecs && cooldownSecs > 0) {
                const expireTime = moment().add(cooldownSecs, 'seconds');
                cooldownCache.set(username, expireTime, cooldownSecs);
            }
        } else {
            await TwitchApi.chat.sendChatMessage(
                `Incorrect bid usage: ${userCommand.trigger} [bidAmount]`,
                chatMessage.id,
                sendAsBot
            );
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

exports.purgeCaches = purgeCaches;
exports.registerBidCommand = registerBidCommand;
exports.unregisterBidCommand = unregisterBidCommand;