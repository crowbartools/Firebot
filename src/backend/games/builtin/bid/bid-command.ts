import moment from "moment";
import NodeCache from "node-cache";

import type { SystemCommand } from "../../../../types/commands";

import { CommandManager } from "../../../chat/commands/command-manager";
import { GameManager } from "../../game-manager";
import { TwitchApi } from "../../../streaming-platforms/twitch/api";
import currencyAccess from "../../../currency/currency-access";
import currencyManager from "../../../currency/currency-manager";
import { humanizeTime } from "../../../utils";

interface ActiveBiddingInfo {
    active: boolean;
    currentBid: number;
    topBidder: string;
    topBidderDisplayName: string;
}

let activeBiddingInfo: ActiveBiddingInfo = {
    active: false,
    currentBid: 0,
    topBidder: "",
    topBidderDisplayName: ""
};

let bidTimer: NodeJS.Timeout;

const cooldownCache = new NodeCache({ checkperiod: 5 });
const BID_COMMAND_ID = "firebot:bid";

function purgeCaches(): void {
    cooldownCache.flushAll();
    activeBiddingInfo = {
        active: false,
        currentBid: 0,
        topBidder: "",
        topBidderDisplayName: ""
    };
}

function setNewHighBidder(
    username: string,
    userDisplayName: string,
    amount: number
): void {
    activeBiddingInfo.currentBid = amount;
    activeBiddingInfo.topBidder = username;
    activeBiddingInfo.topBidderDisplayName = userDisplayName;
}

async function stopBidding(chatter: string): Promise<void> {
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

const bidCommand: SystemCommand = {
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
    onTriggerEvent: async ({ chatMessage, userCommand }) => {
        const bidSettings = GameManager.getGameSettings("firebot-bid");
        const chatter = bidSettings.settings.chatSettings.chatter as string;
        const sendAsBot = !chatter || chatter.toLowerCase() === "bot";

        const currencyId = bidSettings.settings.currencySettings.currencyId as string;
        const currency = currencyAccess.getCurrencyById(currencyId);
        const currencyName = currency.name;

        if (userCommand.subcommandId === "bidStart") {
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

            if (bidAmount < (bidSettings.settings.currencySettings.minBid as number)) {
                await TwitchApi.chat.sendChatMessage(
                    `The opening bid must be more than ${bidSettings.settings.currencySettings.minBid as number}.`,
                    chatMessage.id,
                    sendAsBot
                );
                return;
            }

            activeBiddingInfo = {
                active: true,
                currentBid: bidAmount,
                topBidder: "",
                topBidderDisplayName: ""
            };

            const raiseMinimum = bidSettings.settings.currencySettings.minIncrement as number;
            const minimumBidWithRaise = activeBiddingInfo.currentBid + raiseMinimum;
            await TwitchApi.chat.sendChatMessage(
                `Bidding has started at ${bidAmount} ${currencyName}. Type !bid ${minimumBidWithRaise} to start bidding.`,
                null,
                sendAsBot
            );

            const timeLimit = (bidSettings.settings.timeSettings.timeLimit as number) * 60000;
            bidTimer = setTimeout(async () => {
                await stopBidding(chatter);
            }, timeLimit);

        } else if (userCommand.subcommandId === "bidStop") {
            await stopBidding(chatter);
        } else if (userCommand.subcommandId === "bidAmount") {

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
                const timeRemainingDisplay = humanizeTime(Math.abs(moment().diff(cooldownExpireTime, 'seconds')));
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

            const minBid = bidSettings.settings.currencySettings.minBid as number;
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

            const raiseMinimum = bidSettings.settings.currencySettings.minIncrement as number;
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

            const cooldownSecs = bidSettings.settings.cooldownSettings.cooldown as number;
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

function registerBidCommand(): void {
    if (!CommandManager.hasSystemCommand(BID_COMMAND_ID)) {
        CommandManager.registerSystemCommand(bidCommand);
    }
}

function unregisterBidCommand(): void {
    CommandManager.unregisterSystemCommand(BID_COMMAND_ID);
}

export default {
    purgeCaches,
    registerBidCommand,
    unregisterBidCommand
};