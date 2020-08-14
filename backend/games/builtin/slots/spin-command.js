"use strict";

const util = require("../../../utility");
const twitchChat = require("../../../chat/twitch-chat");
const commandManager = require("../../../chat/commands/CommandManager");
const gameManager = require("../../game-manager");
const currencyDatabase = require("../../../database/currencyDatabase");
const customRolesManager = require("../../../roles/custom-roles-manager");
const twitchRolesManager = require("../../../../shared/twitch-roles");
const slotMachine = require("./slot-machine");
const moment = require("moment");
const NodeCache = require("node-cache");

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
    onTriggerEvent: async event => {

        const { chatEvent, userCommand } = event;

        const slotsSettings = gameManager.getGameSettings("firebot-slots");
        const chatter = slotsSettings.settings.chatSettings.chatter;

        if (event.userCommand.subcommandId === "spinAmount") {

            const triggeredArg = userCommand.args[0];
            const wagerAmount = parseInt(triggeredArg);

            const username = userCommand.commandSender;

            if (activeSpinners.get(username)) {
                twitchChat.sendChatMessage(`${username}, your slot machine is actively working!`, null, chatter);
                return;
            }

            let cooldownExpireTime = cooldownCache.get(username);
            if (cooldownExpireTime && moment().isBefore(cooldownExpireTime)) {
                const timeRemainingDisplay = util.secondsForHumans(Math.abs(moment().diff(cooldownExpireTime, 'seconds')));
                twitchChat.sendChatMessage(`${username}, your slot machine is currently on cooldown. Time remaining: ${timeRemainingDisplay}`, null, chatter);
                return;
            }

            if (wagerAmount < 1) {
                twitchChat.sendChatMessage(`${username}, your wager amount must be more than 0.`, null, chatter);
                return;
            }

            const minWager = slotsSettings.settings.currencySettings.minWager;
            if (minWager != null & minWager > 0) {
                if (wagerAmount < minWager) {
                    twitchChat.sendChatMessage(`${username}, your wager amount must be at least ${minWager}.`, null, chatter);
                    return;
                }
            }
            const maxWager = slotsSettings.settings.currencySettings.maxWager;
            if (maxWager != null & maxWager > 0) {
                if (wagerAmount > maxWager) {
                    twitchChat.sendChatMessage(`${username}, your wager amount can be no more than ${maxWager}.`, null, chatter);
                    return;
                }
            }

            activeSpinners.set(username, true);

            const currencyId = slotsSettings.settings.currencySettings.currencyId;
            const userBalance = await currencyDatabase.getUserCurrencyAmount(username, currencyId);
            if (userBalance < wagerAmount) {
                twitchChat.sendChatMessage(`${username}, you don't have enough to wager this amount!`, null, chatter);
                activeSpinners.del(username);
                return;
            }

            let cooldownSecs = slotsSettings.settings.cooldownSettings.cooldown;
            if (cooldownSecs && cooldownSecs > 0) {
                const expireTime = moment().add(cooldownSecs, 'seconds');
                cooldownCache.set(username, expireTime, cooldownSecs);
            }

            await currencyDatabase.adjustCurrencyForUser(username, currencyId, -Math.abs(wagerAmount));

            let successChance = 50;

            let successChancesSettings = slotsSettings.settings.spinSettings.successChances;
            if (successChancesSettings) {
                successChance = successChancesSettings.basePercent;

                const userCustomRoles = customRolesManager.getAllCustomRolesForViewer(username) || [];
                const userTwitchRoles = (userCommand.senderRoles || [])
                    .map(r => twitchRolesManager.mapTwitchRole(r));
                const allRoles = userCustomRoles.concat(userTwitchRoles);

                for (let role of successChancesSettings.roles) {
                    if (allRoles.some(r => r.id === role.roleId)) {
                        successChance = role.percent;
                        break;
                    }
                }
            }

            const successfulRolls = await slotMachine.spin(username, successChance, chatter);

            const winMultiplier = slotsSettings.settings.spinSettings.multiplier;

            const winnings = Math.floor(wagerAmount * (successfulRolls * winMultiplier));

            await currencyDatabase.adjustCurrencyForUser(username, currencyId, winnings);

            const currency = currencyDatabase.getCurrencyById(currencyId);

            twitchChat.sendChatMessage(`${username} hit ${successfulRolls} out of 3 and won ${util.commafy(winnings)} ${currency.name}!`, null, chatter);

            activeSpinners.del(username);
        } else {
            twitchChat.sendChatMessage(`Incorrect spin usage: ${userCommand.trigger} [wagerAmount]`, null, chatter);
        }
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