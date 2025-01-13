import moment, { Moment } from "moment";
import gameManager from "../../game-manager";
import twitchChat from "../../../chat/twitch-chat";
import commandManager from "../../../chat/commands/command-manager";
import currencyManager from "../../../currency/currency-manager";
import util from "../../../utility";
import { GameSettings } from "../../../../types/game-manager";
import { HeistSettings } from "./heist-settings";

type HeistUser = {
    /** The user's name. */
    username: string;
    /** The user's display name. */
    userDisplayName: string;
    /** The amount the user wagered. */
    wager: number;
    /** The users win percentage. */
    successPercentage: number;
    /** The winnings the user will receive should they win. */
    winnings: number;
};

let usersInHeist: HeistUser[] = [];
let cooldownExpireTime: Moment | null = null;
let cooldownTimeoutId: NodeJS.Timeout | null = null;
let startDelayTimeoutId: NodeJS.Timeout | null = null;
let lobbyOpen = false;

function triggerCooldown() {
    const heistSettings = gameManager.getGameSettings("firebot-heist") as GameSettings<HeistSettings>;
    const chatter = heistSettings.settings.chatSettings.chatter;

    const cooldownMins = heistSettings.settings.generalSettings.cooldown || 1;
    const expireTime = moment().add(cooldownMins, 'minutes');
    cooldownExpireTime = expireTime;

    const trigger = commandManager.getSystemCommandTrigger("firebot:heist");
    const cooldownOverMessage = heistSettings.settings.generalMessages.cooldownOver
        .replace("{command}", trigger ?? '!heist');

    if (cooldownOverMessage) {
        cooldownTimeoutId = setTimeout(async (msg) => {
            await twitchChat.sendChatMessage(msg, null, chatter);
        }, cooldownMins * 60000, cooldownOverMessage);
    }
}

async function runHeist() {
    const heistSettings = gameManager.getGameSettings("firebot-heist") as GameSettings<HeistSettings>;
    const chatter = heistSettings.settings.chatSettings.chatter;

    const startMessage = heistSettings.settings.generalMessages.startMessage;

    if (startMessage) {
        await twitchChat.sendChatMessage(startMessage, null, chatter);
    }

    // wait a few secs for suspense
    await util.wait(7 * 1000);

    const survivors: HeistUser[] = [];

    for (const user of usersInHeist) {
        const successful = util.getRandomInt(1, 100) <= user.successPercentage;
        if (successful) {
            survivors.push(user);
        }
    }

    const percentSurvived = (survivors.length / usersInHeist.length) * 100;

    let messages: string[] = [];
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
    for (const user of survivors) {
        await currencyManager.adjustCurrencyForViewer(user.username, currencyId, user.winnings);
    }

    let winningsString;
    if (percentSurvived > 0) {
        winningsString = survivors
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
    } catch {
        //weird error
    }

    // We've completed the heist, lets clean up!
    usersInHeist = [];
}

function triggerLobbyStart(startDelayMins: number) {
    if (lobbyOpen) {
        return;
    }
    lobbyOpen = true;

    if (startDelayTimeoutId != null) {
        clearTimeout(startDelayTimeoutId);
    }

    startDelayTimeoutId = setTimeout(async () => {
        lobbyOpen = false;
        startDelayTimeoutId = null;

        const heistSettings = gameManager.getGameSettings("firebot-heist") as GameSettings<HeistSettings>;
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

        await runHeist();
    }, startDelayMins * 60000);
}

function addUser(user: HeistUser) {
    if (user && !usersInHeist.some(u => u.username === user.username)) {
        usersInHeist.push(user);
    }
}

function userOnTeam(username: string): boolean {
    return usersInHeist.some(u => u.username === username);
}

function clearCooldowns() {
    if (cooldownTimeoutId != null) {
        clearTimeout(cooldownTimeoutId);
        cooldownTimeoutId = null;
    }
    exports.cooldownExpireTime = null;

    if (startDelayTimeoutId != null) {
        clearTimeout(startDelayTimeoutId);
        startDelayTimeoutId = null;
    }
    lobbyOpen = false;
    usersInHeist = [];
}

export default {
    cooldownExpireTime,
    lobbyOpen,

    addUser,
    clearCooldowns,
    triggerLobbyStart,
    userOnTeam
};
