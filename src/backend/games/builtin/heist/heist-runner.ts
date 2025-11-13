import moment from "moment";

import { CommandManager } from "../../../chat/commands/command-manager";
import { GameManager } from "../../game-manager";
import { TwitchApi } from "../../../streaming-platforms/twitch/api";
import currencyManager from "../../../currency/currency-manager";
import { commafy, getRandomInt, wait } from "../../../utils";

interface HeistUser {
    username: string;
    userDisplayName: string;
    wager: number;
    successPercentage: number;
    winnings: number;
}

let usersInHeist: HeistUser[] = [];

let cooldownTimeoutId: NodeJS.Timeout = null;
let startDelayTimeoutId: NodeJS.Timeout = null;

let cooldownExpireTime: moment.Moment;
let lobbyOpen = false;

function triggerCooldown(): void {
    const heistSettings = GameManager.getGameSettings("firebot-heist");
    const chatter = heistSettings.settings.chatSettings.chatter as string;
    const sendAsBot = !chatter || chatter.toLowerCase() === "bot";

    const cooldownMins = heistSettings.settings.generalSettings.cooldown as number || 1;
    const expireTime = moment().add(cooldownMins, 'minutes');
    cooldownExpireTime = expireTime;

    const trigger = CommandManager.getSystemCommandTrigger("firebot:heist");
    const cooldownOverMessage = (heistSettings.settings.generalMessages.cooldownOver as string)
        .replaceAll("{command}", trigger ? trigger : '!heist');

    if (cooldownOverMessage) {
        cooldownTimeoutId = setTimeout(async (msg) => {
            await TwitchApi.chat.sendChatMessage(msg, null, sendAsBot);
        }, cooldownMins * 60000, cooldownOverMessage);
    }
}

async function runHeist() {
    const heistSettings = GameManager.getGameSettings("firebot-heist");
    const chatter = heistSettings.settings.chatSettings.chatter as string;
    const sendAsBot = !chatter || chatter.toLowerCase() === "bot";

    const startMessage = heistSettings.settings.generalMessages.startMessage as string;

    if (startMessage) {
        await TwitchApi.chat.sendChatMessage(startMessage, null, sendAsBot);
    }

    // wait a few secs for suspense
    await wait(7 * 1000);

    const survivors: HeistUser[] = [];

    for (const user of usersInHeist) {
        const successful = getRandomInt(1, 100) <= user.successPercentage;
        if (successful) {
            survivors.push(user);
        }
    }

    const percentSurvived = (survivors.length / usersInHeist.length) * 100;

    let messages: string[];
    if (percentSurvived >= 100) {
        if (usersInHeist.length > 1) {
            messages = heistSettings.settings.groupOutcomeMessages.hundredPercent as string[];
        } else {
            messages = heistSettings.settings.soloOutcomeMessages.soloSuccess as string[];
        }
    } else if (percentSurvived >= 75 && percentSurvived <= 99) {
        messages = heistSettings.settings.groupOutcomeMessages.top25Percent as string[];
    } else if (percentSurvived >= 25 && percentSurvived <= 74) {
        messages = heistSettings.settings.groupOutcomeMessages.mid50Percent as string[];
    } else if (percentSurvived >= 1 && percentSurvived <= 24) {
        messages = heistSettings.settings.groupOutcomeMessages.bottom25Percent as string[];
    } else {
        if (usersInHeist.length > 1) {
            messages = heistSettings.settings.groupOutcomeMessages.zeroPercent as string[];
        } else {
            messages = heistSettings.settings.soloOutcomeMessages.soloFail as string[];
        }
    }

    // this should never happen, but just in case
    if (messages == null || messages.length < 1) {
        messages = [
            "Heist completed!"
        ];
    }

    const randomIndex = getRandomInt(0, messages.length - 1);
    let outcomeMessage = messages[randomIndex];

    if (usersInHeist.length === 1) {
        outcomeMessage = outcomeMessage
            .replaceAll("{user}", usersInHeist[0].userDisplayName);
    }

    const currencyId = heistSettings.settings.currencySettings.currencyId as string;
    for (const user of survivors) {
        await currencyManager.adjustCurrencyForViewer(user.username, currencyId, user.winnings);
    }

    let winningsString: string;
    if (percentSurvived > 0) {
        winningsString = survivors
            .map(s => `${s.userDisplayName} (${commafy(s.winnings)})`)
            .join(", ");
    } else {
        winningsString = "None";
    }

    const winningsMessage = (heistSettings.settings.generalMessages.heistWinnings as string)
        .replaceAll("{winnings}", winningsString);

    try {
        if (outcomeMessage) {
            await TwitchApi.chat.sendChatMessage(outcomeMessage, null, sendAsBot);
        }

        if (winningsMessage) {
            await TwitchApi.chat.sendChatMessage(winningsMessage, null, sendAsBot);
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

        const heistSettings = GameManager.getGameSettings("firebot-heist");
        const minTeamSize = heistSettings.settings.generalSettings.minimumUsers as number;
        if (usersInHeist.length < minTeamSize - 1) { // user is added to usersInHeist after triggerLobbyStart is called in heist-command

            // give currency back to users who joined
            const currencyId = heistSettings.settings.currencySettings.currencyId as string;
            for (const user of usersInHeist) {
                await currencyManager.adjustCurrencyForViewer(user.username, currencyId, user.wager);
            }

            const chatter = heistSettings.settings.chatSettings.chatter as string;
            const sendAsBot = !chatter || chatter.toLowerCase() === "bot";
            let teamTooSmallMessage = heistSettings.settings.generalMessages.teamTooSmall as string;
            if (usersInHeist.length > 0 && teamTooSmallMessage) {
                teamTooSmallMessage = teamTooSmallMessage
                    .replaceAll("{user}", usersInHeist[0].userDisplayName);

                await TwitchApi.chat.sendChatMessage(teamTooSmallMessage, null, sendAsBot);
            }

            usersInHeist = [];
            return;
        }

        triggerCooldown();

        void runHeist();
    }, startDelayMins * 60000);
};

function addUser(user: HeistUser) {
    if (user == null) {
        return;
    }
    if (usersInHeist.some(u => u.username === user.username)) {
        return;
    }
    usersInHeist.push(user);
};

function userOnTeam(username: string) {
    return usersInHeist.some(e => e.username === username);
};

function clearCooldowns(): void {
    if (cooldownTimeoutId != null) {
        clearTimeout(cooldownTimeoutId);
        cooldownTimeoutId = null;
    }
    cooldownExpireTime = null;

    if (startDelayTimeoutId != null) {
        clearTimeout(startDelayTimeoutId);
        startDelayTimeoutId = null;
    }
    lobbyOpen = false;
    usersInHeist = [];
};

export default {
    cooldownExpireTime,
    lobbyOpen,
    triggerLobbyStart,
    addUser,
    userOnTeam,
    clearCooldowns
};