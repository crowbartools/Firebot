"use strict";
const moment = require("moment");
const gameManager = require("../../game-manager");
const twitchChat = require("../../../chat/twitch-chat");
const commandManager = require("../../../chat/commands/command-manager");
const currencyManager = require("../../../currency/currency-manager");
const util = require("../../../utility");

/**
 * @typedef HeistUser
 * @property {string} username - The user's name
 * @property {string} userDisplayName - The user's display name
 * @property {number} wager - The amount the user wagered
 * @property {number} successPercentage - The users win percentage
 * @property {number} winnings - The winnings the user will receive should they win
 *
 */

/**@type {HeistUser[]} */
let usersInHeist = [];

exports.cooldownExpireTime = null;
let cooldownTimeoutId = null;

let startDelayTimeoutId = null;
exports.lobbyOpen = false;

function triggerCooldown() {
    const heistSettings = gameManager.getGameSettings("firebot-heist");
    const chatter = heistSettings.settings.chatSettings.chatter;

    const cooldownMins = heistSettings.settings.generalSettings.cooldown || 1;
    const expireTime = moment().add(cooldownMins, 'minutes');
    exports.cooldownExpireTime = expireTime;

    const trigger = commandManager.getSystemCommandTrigger("firebot:heist");
    const cooldownOverMessage = heistSettings.settings.generalMessages.cooldownOver
        .replace("{command}", trigger ? trigger : '!heist');

    if (cooldownOverMessage) {
        cooldownTimeoutId = setTimeout(async (msg) => {
            await twitchChat.sendChatMessage(msg, null, chatter);
        }, cooldownMins * 60000, cooldownOverMessage);
    }
}

async function runHeist() {
    const heistSettings = gameManager.getGameSettings("firebot-heist");
    const chatter = heistSettings.settings.chatSettings.chatter;

    const startMessage = heistSettings.settings.generalMessages.startMessage;

    if (startMessage) {
        await twitchChat.sendChatMessage(startMessage, null, chatter);
    }

    // wait a few secs for suspense
    await util.wait(7 * 1000);

    const survivers = [];

    for (const user of usersInHeist) {
        const successful = util.getRandomInt(1, 100) <= user.successPercentage;
        if (successful) {
            survivers.push(user);
        }
    }

    const percentSurvived = (survivers.length / usersInHeist.length) * 100;

    let messages;
    if (percentSurvived >= 100) {
        if (usersInHeist.length > 1) {
            messages = heistSettings.settings.groupOutcomeMessages.hundredPercent;
        } else {
            messages = heistSettings.settings.soloOutcomeMessages.soloSuccess;
        }
    } else if (percentSurvived >= 75 && percentSurvived <= 99) {
        messages = heistSettings.settings.groupOutcomeMessages.top25Percent;
    } else if (percentSurvived >= 25 && percentSurvived <= 74) {
        messages = heistSettings.settings.groupOutcomeMessages.mid50Percent;
    } else if (percentSurvived >= 1 && percentSurvived <= 24) {
        messages = heistSettings.settings.groupOutcomeMessages.bottom25Percent;
    } else {
        if (usersInHeist.length > 1) {
            messages = heistSettings.settings.groupOutcomeMessages.zeroPercent;
        } else {
            messages = heistSettings.settings.soloOutcomeMessages.soloFail;
        }
    }

    // this should never happen, but just in case
    if (messages == null || messages.length < 1) {
        messages = [
            "Heist completed!"
        ];
    }

    const randomIndex = util.getRandomInt(0, messages.length - 1);
    let outcomeMessage = messages[randomIndex];

    if (usersInHeist.length === 1) {
        outcomeMessage = outcomeMessage
            .replace("{user}", usersInHeist[0].userDisplayName);
    }

    const currencyId = heistSettings.settings.currencySettings.currencyId;
    for (const user of survivers) {
        await currencyManager.adjustCurrencyForViewer(user.username, currencyId, user.winnings);
    }

    let winningsString;
    if (percentSurvived > 0) {
        winningsString = survivers
            .map(s => `${s.userDisplayName} (${util.commafy(s.winnings)})`)
            .join(", ");
    } else {
        winningsString = "None";
    }

    const winningsMessage = heistSettings.settings.generalMessages.heistWinnings
        .replace("{winnings}", winningsString);

    try {
        if (outcomeMessage) {
            await twitchChat.sendChatMessage(outcomeMessage, null, chatter);
        }

        if (winningsMessage) {
            await twitchChat.sendChatMessage(winningsMessage, null, chatter);
        }
    } catch (error) {
        //weird error
    }

    // We've completed the heist, lets clean up!
    usersInHeist = [];
}


exports.triggerLobbyStart = (startDelayMins) => {
    if (exports.lobbyOpen) {
        return;
    }
    exports.lobbyOpen = true;

    if (startDelayTimeoutId != null) {
        clearTimeout(startDelayTimeoutId);
    }

    startDelayTimeoutId = setTimeout(async () => {
        exports.lobbyOpen = false;
        startDelayTimeoutId = null;

        const heistSettings = gameManager.getGameSettings("firebot-heist");
        const minTeamSize = heistSettings.settings.generalSettings.minimumUsers;
        if (usersInHeist.length < minTeamSize - 1) { // user is added to usersInHeist after triggerLobbyStart is called in heist-command

            // give currency back to users who joined
            const currencyId = heistSettings.settings.currencySettings.currencyId;
            for (const user of usersInHeist) {
                await currencyManager.adjustCurrencyForViewer(user.username, currencyId, user.wager);
            }

            const chatter = heistSettings.settings.chatSettings.chatter;
            let teamTooSmallMessage = heistSettings.settings.generalMessages.teamTooSmall;
            if (usersInHeist.length > 0 && teamTooSmallMessage) {
                teamTooSmallMessage = teamTooSmallMessage
                    .replace("{user}", usersInHeist[0].userDisplayName);

                await twitchChat.sendChatMessage(teamTooSmallMessage, null, chatter);
            }

            usersInHeist = [];
            return;
        }

        triggerCooldown();

        runHeist();
    }, startDelayMins * 60000);
};

/**
 *
 * @param {HeistUser} user
 */
exports.addUser = (user) => {
    if (user == null) {
        return;
    }
    if (usersInHeist.some(u => u.username === user.username)) {
        return;
    }
    usersInHeist.push(user);
};

exports.userOnTeam = (username) => {
    return usersInHeist.some(e => e.username === username);
};

exports.clearCooldowns = () => {
    if (cooldownTimeoutId != null) {
        clearTimeout(cooldownTimeoutId);
        cooldownTimeoutId = null;
    }
    exports.cooldownExpireTime = null;

    if (startDelayTimeoutId != null) {
        clearTimeout(startDelayTimeoutId);
        startDelayTimeoutId = null;
    }
    exports.lobbyOpen = false;
    usersInHeist = [];
};