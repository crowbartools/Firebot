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

class HeistRunner {
    private usersInHeist: HeistUser[] = [];
    private cooldownTimeoutId: NodeJS.Timeout = null;
    private startDelayTimeoutId: NodeJS.Timeout = null;

    cooldownExpireTime: moment.Moment;
    lobbyOpen = false;

    private triggerCooldown(): void {
        const heistSettings = GameManager.getGameSettings("firebot-heist");
        const chatter = heistSettings.settings.chatSettings.chatter as string;
        const sendAsBot = !chatter || chatter.toLowerCase() === "bot";

        const cooldownMins = heistSettings.settings.generalSettings.cooldown as number || 1;
        const expireTime = moment().add(cooldownMins, 'minutes');
        this.cooldownExpireTime = expireTime;

        const trigger = CommandManager.getSystemCommandTrigger("firebot:heist");
        const cooldownOverMessage = (heistSettings.settings.generalMessages.cooldownOver as string)
            .replaceAll("{command}", trigger ? trigger : '!heist');

        if (cooldownOverMessage) {
            this.cooldownTimeoutId = setTimeout(async (msg) => {
                await TwitchApi.chat.sendChatMessage(msg, null, sendAsBot);
            }, cooldownMins * 60000, cooldownOverMessage);
        }
    }

    private async runHeist() {
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

        for (const user of this.usersInHeist) {
            const successful = getRandomInt(1, 100) <= user.successPercentage;
            if (successful) {
                survivors.push(user);
            }
        }

        const percentSurvived = (survivors.length / this.usersInHeist.length) * 100;

        let messages: string[];
        if (percentSurvived >= 100) {
            if (this.usersInHeist.length > 1) {
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
            if (this.usersInHeist.length > 1) {
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

        if (this.usersInHeist.length === 1) {
            outcomeMessage = outcomeMessage
                .replaceAll("{user}", this.usersInHeist[0].userDisplayName);
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
        this.usersInHeist = [];
    }


    triggerLobbyStart(startDelayMins: number) {
        if (this.lobbyOpen) {
            return;
        }
        this.lobbyOpen = true;

        if (this.startDelayTimeoutId != null) {
            clearTimeout(this.startDelayTimeoutId);
        }

        this.startDelayTimeoutId = setTimeout(async () => {
            this.lobbyOpen = false;
            this.startDelayTimeoutId = null;

            const heistSettings = GameManager.getGameSettings("firebot-heist");
            const minTeamSize = heistSettings.settings.generalSettings.minimumUsers as number;
            if (this.usersInHeist.length < minTeamSize - 1) { // user is added to usersInHeist after triggerLobbyStart is called in heist-command

                // give currency back to users who joined
                const currencyId = heistSettings.settings.currencySettings.currencyId as string;
                for (const user of this.usersInHeist) {
                    await currencyManager.adjustCurrencyForViewer(user.username, currencyId, user.wager);
                }

                const chatter = heistSettings.settings.chatSettings.chatter as string;
                const sendAsBot = !chatter || chatter.toLowerCase() === "bot";
                let teamTooSmallMessage = heistSettings.settings.generalMessages.teamTooSmall as string;
                if (this.usersInHeist.length > 0 && teamTooSmallMessage) {
                    teamTooSmallMessage = teamTooSmallMessage
                        .replaceAll("{user}", this.usersInHeist[0].userDisplayName);

                    await TwitchApi.chat.sendChatMessage(teamTooSmallMessage, null, sendAsBot);
                }

                this.usersInHeist = [];
                return;
            }

            this.triggerCooldown();

            void this.runHeist();
        }, startDelayMins * 60000);
    };

    addUser(user: HeistUser) {
        if (user == null) {
            return;
        }
        if (this.usersInHeist.some(u => u.username === user.username)) {
            return;
        }
        this.usersInHeist.push(user);
    };

    userOnTeam(username: string) {
        return this.usersInHeist.some(e => e.username === username);
    };

    clearCooldowns(): void {
        if (this.cooldownTimeoutId != null) {
            clearTimeout(this.cooldownTimeoutId);
            this.cooldownTimeoutId = null;
        }
        this.cooldownExpireTime = null;

        if (this.startDelayTimeoutId != null) {
            clearTimeout(this.startDelayTimeoutId);
            this.startDelayTimeoutId = null;
        }
        this.lobbyOpen = false;
        this.usersInHeist = [];
    };
}

const heistRunner = new HeistRunner();

export default heistRunner;