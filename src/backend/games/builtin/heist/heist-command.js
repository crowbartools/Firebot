"use strict";


const util = require("../../../utility");
const { TwitchApi } = require("../../../streaming-platforms/twitch/api");
const commandManager = require("../../../chat/commands/command-manager");
const gameManager = require("../../game-manager");
const currencyAccess = require("../../../currency/currency-access").default;
const currencyManager = require("../../../currency/currency-manager");
const customRolesManager = require("../../../roles/custom-roles-manager");
const teamRolesManager = require("../../../roles/team-roles-manager");
const twitchRolesManager = require("../../../../shared/twitch-roles");
const moment = require("moment");

const heistRunner = require("./heist-runner");
const logger = require("../../../logwrapper");

const HEIST_COMMAND_ID = "firebot:heist";

const heistCommand = {
    definition: {
        id: HEIST_COMMAND_ID,
        name: "Heist",
        active: true,
        trigger: "!heist",
        description: "Allows viewers to play the Heist game.",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        hideCooldowns: true,
        baseCommandDescription: "Starts/joins the heist with the default wager amount, if one is set.",
        subCommands: [
            {
                id: "wagerAmount",
                arg: "\\d+",
                regex: true,
                usage: "[wagerAmount]",
                description: "Starts/joins the heist with the given amount.",
                hideCooldowns: true
            }
        ]
    },
    onTriggerEvent: async (event) => {

        const { chatEvent, userCommand } = event;

        const username = userCommand.commandSender;
        const user = await TwitchApi.users.getUserByName(username);
        if (user == null) {
            logger.warn(`Could not process heist command for ${username}. User does not exist.`);
            return;
        }

        const heistSettings = gameManager.getGameSettings("firebot-heist");
        const chatter = heistSettings.settings.chatSettings.chatter;
        const sendAsBot = !chatter || chatter.toLowerCase() === "bot";

        const currencyId = heistSettings.settings.currencySettings.currencyId;
        const currency = currencyAccess.getCurrencyById(currencyId);

        // make sure the currency still exists
        if (currency == null) {
            await TwitchApi.chat.sendChatMessage(
                "Unable to start a Heist game as the selected currency appears to not exist anymore.",
                null,
                sendAsBot
            );
            await TwitchApi.chat.deleteChatMessage(chatEvent.id);
        }

        // see if the heist is on cooldown before doing anything else
        if (heistRunner.cooldownExpireTime && moment().isBefore(heistRunner.cooldownExpireTime)) {
            if (heistSettings.settings.generalMessages.onCooldown) {
                const timeRemainingDisplay = util.secondsForHumans(Math.abs(moment().diff(heistRunner.cooldownExpireTime, 'seconds')));
                const cooldownMsg = heistSettings.settings.generalMessages.onCooldown
                    .replaceAll("{cooldown}", timeRemainingDisplay);

                await TwitchApi.chat.sendChatMessage(cooldownMsg, null, sendAsBot);
            }

            return;
        }

        // check if the user has already joined an active heist
        if (heistRunner.lobbyOpen && heistRunner.userOnTeam(username)) {
            if (heistSettings.settings.entryMessages.alreadyJoined) {
                const alreadyJoinedMsg = heistSettings.settings.entryMessages.alreadyJoined
                    .replaceAll("{user}", user.displayName);

                await TwitchApi.chat.sendChatMessage(alreadyJoinedMsg, null, sendAsBot);
            }

            return;
        }

        // parse the wager amount
        let wagerAmount;
        if (event.userCommand.args.length < 1) {
            const defaultWager = heistSettings.settings.currencySettings.defaultWager;
            if ((defaultWager == null || defaultWager < 1)) {
                if (heistSettings.settings.entryMessages.noWagerAmount) {
                    const noWagerAmountMsg = heistSettings.settings.entryMessages.noWagerAmount
                        .replaceAll("{user}", user.displayName);

                    await TwitchApi.chat.sendChatMessage(noWagerAmountMsg, null, sendAsBot);
                }

                return;
            }
            wagerAmount = defaultWager;
        } else if (event.userCommand.subcommandId === "wagerAmount") {
            const triggeredArg = userCommand.args[0];
            wagerAmount = parseInt(triggeredArg);
        } else {
            if (heistSettings.settings.entryMessages.invalidWagerAmount) {
                const invalidWagerAmountMsg = heistSettings.settings.entryMessages.invalidWagerAmount
                    .replaceAll("{user}", user.displayName);

                await TwitchApi.chat.sendChatMessage(invalidWagerAmountMsg, null, sendAsBot);
            }

            return;
        }

        wagerAmount = Math.floor(wagerAmount || 0);

        // make sure wager doesnt violate min or max values
        const minWager = heistSettings.settings.currencySettings.minWager || 1;
        if (minWager != null && minWager > 0) {
            if (wagerAmount < minWager) {
                if (heistSettings.settings.entryMessages.wagerAmountTooLow) {
                    const wagerAmountTooLowMsg = heistSettings.settings.entryMessages.wagerAmountTooLow
                        .replaceAll("{user}", user.displayName)
                        .replaceAll("{minWager}", minWager);

                    await TwitchApi.chat.sendChatMessage(wagerAmountTooLowMsg, null, sendAsBot);
                }

                return;
            }
        }
        const maxWager = heistSettings.settings.currencySettings.maxWager;
        if (maxWager != null && maxWager > 0) {
            if (wagerAmount > maxWager) {
                if (heistSettings.settings.entryMessages.wagerAmountTooHigh) {
                    const wagerAmountTooHighMsg = heistSettings.settings.entryMessages.wagerAmountTooHigh
                        .replaceAll("{user}", user.displayName)
                        .replaceAll("{maxWager}", maxWager);

                    await TwitchApi.chat.sendChatMessage(wagerAmountTooHighMsg, null, sendAsBot);
                }

                return;
            }
        }

        // check users balance
        const userBalance = await currencyManager.getViewerCurrencyAmount(username, currencyId);
        if (userBalance < wagerAmount) {
            if (heistSettings.settings.entryMessages.notEnoughToWager) {
                const notEnoughToWagerMsg = heistSettings.settings.entryMessages.notEnoughToWager
                    .replaceAll("{user}", user.displayName);

                await TwitchApi.chat.sendChatMessage(notEnoughToWagerMsg, null, sendAsBot);
            }

            return;
        }

        // deduct wager from user balance
        await currencyManager.adjustCurrencyForViewerById(user.id, currencyId, 0 - Math.abs(wagerAmount));

        // get all user roles
        const userCustomRoles = customRolesManager.getAllCustomRolesForViewer(user.id) || [];
        const userTeamRoles = await teamRolesManager.getAllTeamRolesForViewer(user.id) || [];
        const userTwitchRoles = (userCommand.senderRoles || [])
            .map(r => twitchRolesManager.mapTwitchRole(r))
            .filter(r => !!r);
        const allRoles = [
            ...userTwitchRoles,
            ...userTeamRoles,
            ...userCustomRoles
        ];

        // get the users success percentage
        let successChance = 50;
        const successChancesSettings = heistSettings.settings.successChanceSettings.successChances;
        if (successChancesSettings) {
            successChance = successChancesSettings.basePercent;

            for (const role of successChancesSettings.roles) {
                if (allRoles.some(r => r.id === role.roleId)) {
                    successChance = role.percent;
                    break;
                }
            }
        }

        // get the users winnings multiplier
        let winningsMultiplier = 1.5;
        const winningsMultiplierSettings = heistSettings.settings.winningsMultiplierSettings.multipliers;
        if (winningsMultiplierSettings) {
            winningsMultiplier = winningsMultiplierSettings.base;

            for (const role of winningsMultiplierSettings.roles) {
                if (allRoles.some(r => r.id === role.roleId)) {
                    winningsMultiplier = role.value;
                    break;
                }
            }
        }

        // Ensure the game has been started and the lobby ready
        if (!heistRunner.lobbyOpen) {

            const startDelay = heistSettings.settings.generalSettings.startDelay || 1;
            heistRunner.triggerLobbyStart(startDelay);

            const teamCreationMessage = heistSettings.settings.generalMessages.teamCreation
                .replaceAll("{user}", user.displayName)
                .replaceAll("{command}", userCommand.trigger)
                .replaceAll("{maxWager}", maxWager)
                .replaceAll("{minWager}", minWager)
                .replaceAll("{requiredUsers}", heistSettings.settings.generalSettings.minimumUsers);

            if (teamCreationMessage) {
                await TwitchApi.chat.sendChatMessage(teamCreationMessage, null, sendAsBot);
            }
        }

        // add the user to the game
        heistRunner.addUser({
            username: username,
            userDisplayName: user.displayName,
            wager: wagerAmount,
            successPercentage: successChance,
            winnings: Math.floor(wagerAmount * winningsMultiplier)
        });

        const onJoinMessage = heistSettings.settings.entryMessages.onJoin
            .replaceAll("{user}", user.displayName)
            .replaceAll("{wager}", util.commafy(wagerAmount))
            .replaceAll("{currency}", currency.name);

        if (onJoinMessage) {
            await TwitchApi.chat.sendChatMessage(onJoinMessage, null, sendAsBot);
        }
    }
};

function registerHeistCommand() {
    if (!commandManager.hasSystemCommand(HEIST_COMMAND_ID)) {
        commandManager.registerSystemCommand(heistCommand);
    }
}

function unregisterHeistCommand() {
    commandManager.unregisterSystemCommand(HEIST_COMMAND_ID);
}

function clearCooldown() {
    heistRunner.clearCooldowns();
}

exports.clearCooldown = clearCooldown;
exports.registerHeistCommand = registerHeistCommand;
exports.unregisterHeistCommand = unregisterHeistCommand;