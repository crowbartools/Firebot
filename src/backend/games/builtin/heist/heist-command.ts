import util from "../../../utility";
import twitchChat from "../../../chat/twitch-chat";
import twitchApi from "../../../twitch-api/api";
import commandManager from "../../../chat/commands/command-manager";
import gameManager from "../../game-manager";
import currencyAccess from "../../../currency/currency-access";
import currencyManager from "../../../currency/currency-manager";
import customRolesManager from "../../../roles/custom-roles-manager";
import teamRolesManager from "../../../roles/team-roles-manager";
import twitchRolesManager from "../../../../shared/twitch-roles";
import { SystemCommand } from "../../../../types/commands";
import { GameSettings } from "../../../../types/game-manager";
import heistRunner from "./heist-runner";
import { HeistSettings } from "./heist-settings";
import moment from "moment";

const HEIST_COMMAND_ID = "firebot:heist";

const heistCommand: SystemCommand = {
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
        const { chatMessage, userCommand } = event;

        const username = userCommand.commandSender;
        const user = {
            displayName: chatMessage.userDisplayName ?? userCommand.commandSender,
            id: chatMessage.userId
        };
        const heistSettings = gameManager.getGameSettings("firebot-heist") as GameSettings<HeistSettings>;
        const { currencySettings } = heistSettings.settings;
        const chatter = heistSettings.settings.chatSettings.chatter;

        const currencyId = currencySettings.currencyId;
        const currency = currencyAccess.getCurrencyById(currencyId);

        // make sure the currency still exists
        if (currency == null) {
            await twitchChat.sendChatMessage("Unable to start a Heist game as the selected currency appears to not exist anymore.", null, chatter);
            await twitchApi.chat.deleteChatMessage(chatMessage.id);
            return;
        }

        // see if the heist is on cooldown before doing anything else
        if (heistRunner.cooldownExpireTime && moment().isBefore(heistRunner.cooldownExpireTime)) {
            if (heistSettings.settings.generalMessages.onCooldown) {
                const timeRemainingDisplay = util.secondsForHumans(Math.abs(moment().diff(heistRunner.cooldownExpireTime, 'seconds')));
                const cooldownMsg = heistSettings.settings.generalMessages.onCooldown
                    .replace("{cooldown}", timeRemainingDisplay);

                await twitchChat.sendChatMessage(cooldownMsg, null, chatter);
            }

            return;
        }

        // check if the user has already joined an active heist
        if (heistRunner.lobbyOpen && heistRunner.userOnTeam(username)) {
            if (heistSettings.settings.entryMessages.alreadyJoined) {
                const alreadyJoinedMsg = heistSettings.settings.entryMessages.alreadyJoined
                    .replace("{user}", user.displayName);

                await twitchChat.sendChatMessage(alreadyJoinedMsg, null, chatter);
            }

            return;
        }

        // parse the wager amount
        let wagerAmount: number = undefined;
        if (event.userCommand.args.length < 1) {
            const { defaultWager } = currencySettings;
            if (defaultWager == null || defaultWager < 1) {
                if (heistSettings.settings.entryMessages.noWagerAmount) {
                    const noWagerAmountMsg = heistSettings.settings.entryMessages.noWagerAmount
                        .replace("{user}", user.displayName);

                    await twitchChat.sendChatMessage(noWagerAmountMsg, null, chatter);
                }

                return;
            }
            wagerAmount = defaultWager;
        } else if (event.userCommand.subcommandId === "wagerAmount") {
            const triggeredArg = userCommand.args[0];
            wagerAmount = parseInt(triggeredArg);
        }

        if (wagerAmount == null || Number.isNaN(wagerAmount) || !Number.isFinite(wagerAmount) || wagerAmount < 0) {
            if (heistSettings.settings.entryMessages.invalidWagerAmount) {
                const invalidWagerAmountMsg = heistSettings.settings.entryMessages.invalidWagerAmount
                    .replace("{user}", user.displayName);

                await twitchChat.sendChatMessage(invalidWagerAmountMsg, null, chatter);
            }

            return;
        }

        wagerAmount = Math.floor(wagerAmount);

        // make sure wager doesn't violate min or max values
        const minWager = currencySettings.minWager && !Number.isNaN(currencySettings.minWager) && currencySettings.minWager > 0
            ? currencySettings.minWager
            : 1;
        if (wagerAmount < minWager) {
            if (heistSettings.settings.entryMessages.wagerAmountTooLow) {
                const wagerAmountTooLowMsg = heistSettings.settings.entryMessages.wagerAmountTooLow
                    .replace("{user}", user.displayName)
                    .replace("{minWager}", `${minWager}`);

                await twitchChat.sendChatMessage(wagerAmountTooLowMsg, null, chatter);
            }

            return;
        }
        const maxWager = currencySettings.maxWager && !Number.isNaN(currencySettings.maxWager) && currencySettings.maxWager > minWager
            ? currencySettings.maxWager
            : Number.MAX_SAFE_INTEGER;
        const maxWagerText = maxWager !== Number.MAX_SAFE_INTEGER ? util.commafy(maxWager) : "unlimited";
        if (wagerAmount > maxWager) {
            if (heistSettings.settings.entryMessages.wagerAmountTooHigh) {
                const wagerAmountTooHighMsg = heistSettings.settings.entryMessages.wagerAmountTooHigh
                    .replace("{user}", user.displayName)
                    .replace("{maxWager}", maxWagerText);

                await twitchChat.sendChatMessage(wagerAmountTooHighMsg, null, chatter);
            }

            return;
        }

        // check users balance
        const userBalance = await currencyManager.getViewerCurrencyAmount(username, currencyId);
        if (userBalance < wagerAmount) {
            if (heistSettings.settings.entryMessages.notEnoughToWager) {
                const notEnoughToWagerMsg = heistSettings.settings.entryMessages.notEnoughToWager
                    .replace("{user}", user.displayName);

                await twitchChat.sendChatMessage(notEnoughToWagerMsg, null, chatter);
            }

            return;
        }

        // deduct wager from user balance
        await currencyManager.adjustCurrencyForViewerById(user.id, currencyId, -wagerAmount);

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
        const { successChances } = heistSettings.settings.successChanceSettings;
        if (successChances) {
            successChance = successChances.basePercent;

            for (const role of successChances.roles) {
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

            if (heistSettings.settings.generalMessages.teamCreation) {
                const teamCreationMessage = heistSettings.settings.generalMessages.teamCreation
                    .replace("{user}", user.displayName)
                    .replace("{command}", userCommand.trigger)
                    .replace("{maxWager}", maxWagerText)
                    .replace("{minWager}", util.commafy(minWager))
                    .replace("{requiredUsers}", `${heistSettings.settings.generalSettings.minimumUsers ?? "1"}`);

                await twitchChat.sendChatMessage(teamCreationMessage, null, chatter);
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

        if (heistSettings.settings.entryMessages.onJoin) {
            const onJoinMessage = heistSettings.settings.entryMessages.onJoin
                .replace("{user}", user.displayName)
                .replace("{wager}", util.commafy(wagerAmount))
                .replace("{currency}", currency.name);

            await twitchChat.sendChatMessage(onJoinMessage, null, chatter);
        }
    }
};

function registerHeistCommand() {
    if (!commandManager.hasSystemCommand(HEIST_COMMAND_ID)) {
        commandManager.registerSystemCommand(heistCommand);
    }
}

function unregisterHeistCommand() {
    if (commandManager.hasSystemCommand(HEIST_COMMAND_ID)) {
        commandManager.unregisterSystemCommand(HEIST_COMMAND_ID);
    }
}

function clearCooldown() {
    heistRunner.clearCooldowns();
}

export default {
    clearCooldown,
    registerHeistCommand,
    unregisterHeistCommand
};
