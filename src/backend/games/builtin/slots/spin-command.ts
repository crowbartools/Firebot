import moment from "moment";
import NodeCache from "node-cache";

import type { SystemCommand } from "../../../../types/commands";
import type { RolePercentageParameterValue } from "../../../../types/parameters";

import { CommandManager } from "../../../chat/commands/command-manager";
import { GameManager } from "../../game-manager";
import { TwitchApi } from "../../../streaming-platforms/twitch/api";
import currencyAccess from "../../../currency/currency-access";
import currencyManager from "../../../currency/currency-manager";
import customRolesManager from "../../../roles/custom-roles-manager";
import teamRolesManager from "../../../roles/team-roles-manager";
import twitchRolesManager from "../../../../shared/twitch-roles";
import logger from "../../../logwrapper";
import { commafy, humanizeTime } from "../../../utils";

import slotMachine from "./slot-machine";

const activeSpinners = new NodeCache({ checkperiod: 2 });
const cooldownCache = new NodeCache({ checkperiod: 5 });

const SPIN_COMMAND_ID = "firebot:spin";

const spinCommand: SystemCommand = {
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
    onTriggerEvent: async ({ userCommand }) => {
        const slotsSettings = GameManager.getGameSettings("firebot-slots");
        const chatter = slotsSettings.settings.chatSettings.chatter as string;
        const sendAsBot = !chatter || chatter.toLowerCase() === "bot";
        const username = userCommand.commandSender;
        const user = await TwitchApi.users.getUserByName(username);
        if (user == null) {
            logger.warn(`Could not process spin command for ${username}. User does not exist.`);
            return;
        }

        // parse the wager amount
        let wagerAmount: number;
        if (userCommand.args.length < 1) {
            const defaultWager = slotsSettings.settings.currencySettings.defaultWager as number;
            if (defaultWager == null || defaultWager < 1) {
                if (slotsSettings.settings.generalMessages.noWagerAmount) {
                    const noWagerAmountMsg = (slotsSettings.settings.generalMessages.noWagerAmount as string)
                        .replaceAll("{user}", user.displayName);

                    await TwitchApi.chat.sendChatMessage(noWagerAmountMsg, null, sendAsBot);
                }

                return;
            }
            wagerAmount = defaultWager;
        } else if (userCommand.subcommandId === "spinAmount") {
            const triggeredArg = userCommand.args[0];
            wagerAmount = parseInt(triggeredArg);
        } else {
            if (slotsSettings.settings.generalMessages.invalidWagerAmount) {
                const invalidWagerAmountMsg = (slotsSettings.settings.generalMessages.invalidWagerAmount as string)
                    .replaceAll("{user}", user.displayName);

                await TwitchApi.chat.sendChatMessage(invalidWagerAmountMsg, null, sendAsBot);
            }

            return;
        }

        if (activeSpinners.get(username)) {
            if (slotsSettings.settings.generalMessages.alreadySpinning) {
                const alreadySpinningMsg = (slotsSettings.settings.generalMessages.alreadySpinning as string)
                    .replaceAll("{username}", user.displayName);

                await TwitchApi.chat.sendChatMessage(alreadySpinningMsg, null, sendAsBot);
            }

            return;
        }

        const cooldownExpireTime = cooldownCache.get(username);
        if (cooldownExpireTime && moment().isBefore(cooldownExpireTime)) {
            if (slotsSettings.settings.generalMessages.onCooldown) {
                const timeRemainingDisplay = humanizeTime(Math.abs(moment().diff(cooldownExpireTime, 'seconds')));
                const cooldownMsg = (slotsSettings.settings.generalMessages.onCooldown as string)
                    .replaceAll("{username}", user.displayName)
                    .replaceAll("{timeRemaining}", timeRemainingDisplay);

                await TwitchApi.chat.sendChatMessage(cooldownMsg, null, sendAsBot);
            }

            return;
        }

        if (wagerAmount < 1) {
            if (slotsSettings.settings.generalMessages.moreThanZero) {
                const moreThanZeroMsg = (slotsSettings.settings.generalMessages.moreThanZero as string)
                    .replaceAll("{username}", user.displayName);

                await TwitchApi.chat.sendChatMessage(moreThanZeroMsg, null, sendAsBot);
            }

            return;
        }

        const minWager = slotsSettings.settings.currencySettings.minWager as number;
        if (minWager != null && minWager > 0) {
            if (wagerAmount < minWager) {
                if (slotsSettings.settings.generalMessages.minWager) {
                    const minWagerMsg = (slotsSettings.settings.generalMessages.minWager as string)
                        .replaceAll("{username}", user.displayName)
                        .replaceAll("{minWager}", minWager.toString());

                    await TwitchApi.chat.sendChatMessage(minWagerMsg, null, sendAsBot);
                }

                return;
            }
        }
        const maxWager = slotsSettings.settings.currencySettings.maxWager as number;
        if (maxWager != null && maxWager > 0) {
            if (wagerAmount > maxWager) {
                if (slotsSettings.settings.generalMessages.maxWager) {
                    const maxWagerMsg = (slotsSettings.settings.generalMessages.maxWager as string)
                        .replaceAll("{username}", user.displayName)
                        .replaceAll("{maxWager}", maxWager.toString());

                    await TwitchApi.chat.sendChatMessage(maxWagerMsg, null, sendAsBot);
                }

                return;
            }
        }

        const currencyId = slotsSettings.settings.currencySettings.currencyId as string;
        let userBalance;
        try {
            userBalance = await currencyManager.getViewerCurrencyAmount(username, currencyId);
        } catch (error) {
            logger.error(error);
            userBalance = 0;
        }

        if (userBalance < wagerAmount) {
            if (slotsSettings.settings.generalMessages.notEnough) {
                const notEnoughMsg = (slotsSettings.settings.generalMessages.notEnough as string)
                    .replaceAll("{username}", user.displayName);

                await TwitchApi.chat.sendChatMessage(notEnoughMsg, null, sendAsBot);
            }

            return;
        }

        activeSpinners.set(username, true);

        const cooldownSecs = slotsSettings.settings.cooldownSettings.cooldown as number;
        if (cooldownSecs && cooldownSecs > 0) {
            const expireTime = moment().add(cooldownSecs, 'seconds');
            cooldownCache.set(username, expireTime, cooldownSecs);
        }

        try {
            await currencyManager.adjustCurrencyForViewerById(user.id, currencyId, 0 - Math.abs(wagerAmount));
        } catch (error) {
            logger.error(error);
            await TwitchApi.chat.sendChatMessage(`Sorry ${user.displayName}, there was an error deducting currency from your balance so the spin has been canceled.`, null, sendAsBot);
            activeSpinners.del(username);
            return;
        }

        let successChance = 50;

        const successChancesSettings = slotsSettings.settings.spinSettings.successChances as RolePercentageParameterValue;
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

        const spinInActionMsg = (slotsSettings.settings.generalMessages.spinInAction as string)
            .replaceAll("{username}", user.displayName);
        const showSpinInActionMsg = !!slotsSettings.settings.generalMessages.spinInAction;
        const successfulRolls = await slotMachine.spin(showSpinInActionMsg, spinInActionMsg, successChance, chatter);

        const winMultiplier = slotsSettings.settings.spinSettings.multiplier as number;

        const winnings = Math.floor(wagerAmount * (successfulRolls * winMultiplier));

        await currencyManager.adjustCurrencyForViewerById(user.id, currencyId, winnings);

        if (slotsSettings.settings.generalMessages.spinSuccessful) {
            const currency = currencyAccess.getCurrencyById(currencyId);

            const spinSuccessfulMsg = (slotsSettings.settings.generalMessages.spinSuccessful as string)
                .replaceAll("{username}", user.displayName)
                .replaceAll("{successfulRolls}", successfulRolls.toString())
                .replaceAll("{winningsAmount}", commafy(winnings))
                .replaceAll("{currencyName}", currency.name);
            await TwitchApi.chat.sendChatMessage(spinSuccessfulMsg, null, sendAsBot);
        }

        activeSpinners.del(username);

    }
};

function registerSpinCommand(): void {
    if (!CommandManager.hasSystemCommand(SPIN_COMMAND_ID)) {
        CommandManager.registerSystemCommand(spinCommand);
    }
}

function unregisterSpinCommand(): void {
    CommandManager.unregisterSystemCommand(SPIN_COMMAND_ID);
}

function purgeCaches(): void {
    cooldownCache.flushAll();
    activeSpinners.flushAll();
}

export default {
    purgeCaches,
    registerSpinCommand,
    unregisterSpinCommand
};