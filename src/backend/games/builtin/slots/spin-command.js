"use strict";

const util = require("../../../utility");
const twitchChat = require("../../../chat/twitch-chat");
const commandManager = require("../../../chat/commands/command-manager");
const gameManager = require("../../game-manager");
const currencyAccess = require("../../../currency/currency-access").default;
const currencyManager = require("../../../currency/currency-manager");
const customRolesManager = require("../../../roles/custom-roles-manager");
const teamRolesManager = require("../../../roles/team-roles-manager");
const twitchRolesManager = require("../../../../shared/twitch-roles");
const slotMachine = require("./slot-machine");
const logger = require("../../../logwrapper");
const moment = require("moment");
const NodeCache = require("node-cache");
const twitchApi = require("../../../twitch-api/api");

const activeSpinners = new NodeCache({checkperiod: 2});
const cooldownCache = new NodeCache({checkperiod: 5});

const SPIN_COMMAND_ID = "firebot:spin";

const spinCommand = {
    definition: {
        id: SPIN_COMMAND_ID,
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
                description: "Spins the slot machine with the given amount",
                hideCooldowns: true
            }
        ]
    },
    onTriggerEvent: async (event) => {

        const { userCommand } = event;

        const slotsSettings = gameManager.getGameSettings("firebot-slots");
        const chatter = slotsSettings.settings.chatSettings.chatter;
        const username = userCommand.commandSender;
        const user = await twitchApi.users.getUserByName(username);
        if (user == null) {
            logger.warn(`Could not process spin command for ${username}. User does not exist.`);
            return;
        }

        // parse the wager amount
        let wagerAmount;
        if (event.userCommand.args.length < 1) {
            const defaultWager = slotsSettings.settings.currencySettings.defaultWager;
            if (defaultWager == null || defaultWager < 1) {
                if (slotsSettings.settings.generalMessages.noWagerAmount) {
                    const noWagerAmountMsg = slotsSettings.settings.generalMessages.noWagerAmount
                        .replace("{user}", user.displayName);

                    await twitchChat.sendChatMessage(noWagerAmountMsg, null, chatter);
                }

                return;
            }
            wagerAmount = defaultWager;
        } else if (event.userCommand.subcommandId === "spinAmount") {
            const triggeredArg = userCommand.args[0];
            wagerAmount = parseInt(triggeredArg);
        } else {
            if (slotsSettings.settings.generalMessages.invalidWagerAmount) {
                const invalidWagerAmountMsg = slotsSettings.settings.generalMessages.invalidWagerAmount
                    .replace("{user}", user.displayName);

                await twitchChat.sendChatMessage(invalidWagerAmountMsg, null, chatter);
            }

            return;
        }

        if (activeSpinners.get(username)) {
            if (slotsSettings.settings.generalMessages.alreadySpinning) {
                const alreadySpinningMsg = slotsSettings.settings.generalMessages.alreadySpinning
                    .replace("{username}", user.displayName);

                await twitchChat.sendChatMessage(alreadySpinningMsg, null, chatter);
            }

            return;
        }

        const cooldownExpireTime = cooldownCache.get(username);
        if (cooldownExpireTime && moment().isBefore(cooldownExpireTime)) {
            if (slotsSettings.settings.generalMessages.onCooldown) {
                const timeRemainingDisplay = util.secondsForHumans(Math.abs(moment().diff(cooldownExpireTime, 'seconds')));
                const cooldownMsg = slotsSettings.settings.generalMessages.onCooldown
                    .replace("{username}", user.displayName).replace("{timeRemaining}", timeRemainingDisplay);

                await twitchChat.sendChatMessage(cooldownMsg, null, chatter);
            }

            return;
        }

        if (wagerAmount < 1) {
            if (slotsSettings.settings.generalMessages.moreThanZero) {
                const moreThanZeroMsg = slotsSettings.settings.generalMessages.moreThanZero
                    .replace("{username}", user.displayName);

                await twitchChat.sendChatMessage(moreThanZeroMsg, null, chatter);
            }

            return;
        }

        const minWager = slotsSettings.settings.currencySettings.minWager;
        if (minWager != null && minWager > 0) {
            if (wagerAmount < minWager) {
                if (slotsSettings.settings.generalMessages.minWager) {
                    const minWagerMsg = slotsSettings.settings.generalMessages.minWager
                        .replace("{username}", user.displayName).replace("{minWager}", minWager);

                    await twitchChat.sendChatMessage(minWagerMsg, null, chatter);
                }

                return;
            }
        }
        const maxWager = slotsSettings.settings.currencySettings.maxWager;
        if (maxWager != null && maxWager > 0) {
            if (wagerAmount > maxWager) {
                if (slotsSettings.settings.generalMessages.maxWager) {
                    const maxWagerMsg = slotsSettings.settings.generalMessages.maxWager
                        .replace("{username}", user.displayName).replace("{maxWager}", maxWager);

                    await twitchChat.sendChatMessage(maxWagerMsg, null, chatter);
                }

                return;
            }
        }

        const currencyId = slotsSettings.settings.currencySettings.currencyId;
        let userBalance;
        try {
            userBalance = await currencyManager.getViewerCurrencyAmount(username, currencyId);
        } catch (error) {
            logger.error(error);
            userBalance = 0;
        }

        if (userBalance < wagerAmount) {
            if (slotsSettings.settings.generalMessages.notEnough) {
                const notEnoughMsg = slotsSettings.settings.generalMessages.notEnough
                    .replace("{username}", user.displayName);

                await twitchChat.sendChatMessage(notEnoughMsg, null, chatter);
            }

            return;
        }

        activeSpinners.set(username, true);

        const cooldownSecs = slotsSettings.settings.cooldownSettings.cooldown;
        if (cooldownSecs && cooldownSecs > 0) {
            const expireTime = moment().add(cooldownSecs, 'seconds');
            cooldownCache.set(username, expireTime, cooldownSecs);
        }

        try {
            await currencyManager.adjustCurrencyForViewerById(user.id, currencyId, 0 - Math.abs(wagerAmount));
        } catch (error) {
            logger.error(error);
            await twitchChat.sendChatMessage(`Sorry ${user.displayName}, there was an error deducting currency from your balance so the spin has been canceled.`, null, chatter);
            activeSpinners.del(username);
            return;
        }

        let successChance = 50;

        const successChancesSettings = slotsSettings.settings.spinSettings.successChances;
        if (successChancesSettings) {
            try {
                successChance = successChancesSettings.basePercent;

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

                for (const role of successChancesSettings.roles) {
                    if (allRoles.some(r => r.id === role.roleId)) {
                        successChance = role.percent;
                        break;
                    }
                }
            } catch (error) {
                logger.error("There was an error while computing success chances, using base", error);
            }
        }

        const spinInActionMsg = slotsSettings.settings.generalMessages.spinInAction
            .replace("{username}", user.displayName);
        const showSpinInActionMsg = !!slotsSettings.settings.generalMessages.spinInAction;
        const successfulRolls = await slotMachine.spin(showSpinInActionMsg, spinInActionMsg, successChance, chatter);

        const winMultiplier = slotsSettings.settings.spinSettings.multiplier;

        const winnings = Math.floor(wagerAmount * (successfulRolls * winMultiplier));

        await currencyManager.adjustCurrencyForViewerById(user.id, currencyId, winnings);

        if (slotsSettings.settings.generalMessages.spinSuccessful) {
            const currency = currencyAccess.getCurrencyById(currencyId);

            const spinSuccessfulMsg = slotsSettings.settings.generalMessages.spinSuccessful
                .replace("{username}", user.displayName)
                .replace("{successfulRolls}", successfulRolls)
                .replace("{winningsAmount}", util.commafy(winnings))
                .replace("{currencyName}", currency.name);
            await twitchChat.sendChatMessage(spinSuccessfulMsg, null, chatter);
        }

        activeSpinners.del(username);

    }
};

function registerSpinCommand() {
    if (!commandManager.hasSystemCommand(SPIN_COMMAND_ID)) {
        commandManager.registerSystemCommand(spinCommand);
    }
}

function unregisterSpinCommand() {
    commandManager.unregisterSystemCommand(SPIN_COMMAND_ID);
}

function purgeCaches() {
    cooldownCache.flushAll();
    activeSpinners.flushAll();
}

exports.purgeCaches = purgeCaches;
exports.registerSpinCommand = registerSpinCommand;
exports.unregisterSpinCommand = unregisterSpinCommand;