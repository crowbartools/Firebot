import moment from "moment";
import NodeCache from "node-cache";

import type { SystemCommand } from "../../../../types/commands";
import type { FirebotChatMessage } from "../../../../types/chat";
import type { RoleNumberParameterValue } from "../../../../types/parameters";

import { CommandManager } from "../../../chat/commands/command-manager";
import { GameManager } from "../../game-manager";
import { TwitchApi } from "../../../streaming-platforms/twitch/api";
import currencyAccess from "../../../currency/currency-access";
import currencyManager from "../../../currency/currency-manager";
import customRolesManager from "../../../roles/custom-roles-manager";
import teamRolesManager from "../../../roles/team-roles-manager";
import twitchListeners from "../../../chat/chat-listeners/twitch-chat-listeners";
import twitchRolesManager from "../../../../shared/twitch-roles";
import logger from "../../../logwrapper";
import { commafy, humanizeTime } from "../../../utils";

import triviaHelper from "./trivia-helper";

interface TriviaQuestion {
    username: string;
    question: {
        answers: string[];
        correctIndex: number;
    };
    wager: number;
    winningsMultiplier: number;
    currencyId: string;
    chatter: string;
    postCorrectAnswer: boolean;
}

let fiveSecTimeoutId: NodeJS.Timeout;
let answerTimeoutId: NodeJS.Timeout;

let currentQuestion: TriviaQuestion = null;

function clearCurrentQuestion(): void {
    currentQuestion = null;
    if (fiveSecTimeoutId) {
        clearTimeout(fiveSecTimeoutId);
        fiveSecTimeoutId = null;
    }
    if (answerTimeoutId) {
        clearTimeout(answerTimeoutId);
        answerTimeoutId = null;
    }
}

twitchListeners.events.on("chat-message", async (data: FirebotChatMessage) => {
    const chatMessage = data;
    if (!currentQuestion) {
        return;
    }
    const { username, question, wager, winningsMultiplier, currencyId, chatter, postCorrectAnswer } = currentQuestion;
    const sendAsBot = !chatter || chatter.toLowerCase() === "bot";
    //ensure chat is from question user
    if (username !== chatMessage.username) {
        return;
    }
    //grab args
    const args = chatMessage.rawText.split(" ");
    if (args.length < 1) {
        return;
    }
    //insure number
    const firstArg = parseInt(args[0]);
    if (isNaN(firstArg)) {
        return;
    }
    // outside the answer bound
    if (firstArg < 1 || firstArg > question.answers.length) {
        return;
    }

    const isCorrect = firstArg === question.correctIndex;

    if (isCorrect) {
        const winnings = Math.floor(wager * winningsMultiplier);

        await currencyManager.adjustCurrencyForViewer(username, currencyId, winnings);

        const currency = currencyAccess.getCurrencyById(currencyId);

        await TwitchApi.chat.sendChatMessage(`${chatMessage.userDisplayName ?? username}, that is correct! You have won ${commafy(winnings)} ${currency.name}`, null, sendAsBot);
    } else {
        await TwitchApi.chat.sendChatMessage(`Sorry ${chatMessage.userDisplayName ?? username}, that is incorrect.${postCorrectAnswer ? ` The correct answer was ${question.answers[question.correctIndex - 1]}.` : ""} Better luck next time!`, null, sendAsBot);
    }
    clearCurrentQuestion();
});

const cooldownCache = new NodeCache({ checkperiod: 5 });

const TRIVIA_COMMAND_ID = "firebot:trivia";

const triviaCommand: SystemCommand = {
    definition: {
        id: TRIVIA_COMMAND_ID,
        name: "Trivia",
        active: true,
        trigger: "!trivia",
        description: "Allows viewers to play trivia",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        hideCooldowns: true,
        subCommands: [
            {
                id: "wagerAmount",
                arg: "\\d+",
                regex: true,
                usage: "[wager]",
                description: "Triggers trivia for the given wager amount",
                hideCooldowns: true
            }
        ]
    },
    onTriggerEvent: async (event) => {
        const { userCommand } = event;

        const triviaSettings = GameManager.getGameSettings("firebot-trivia");
        const chatter = triviaSettings.settings.chatSettings.chatter as string;
        const sendAsBot = !chatter || chatter.toLowerCase() === "bot";

        const username = userCommand.commandSender;
        const user = await TwitchApi.users.getUserByName(username);
        if (user == null) {
            logger.warn(`Could not process trivia command for ${username}. User does not exist.`);
            return;
        }

        if (event.userCommand.subcommandId === "wagerAmount") {
            const triggeredArg = userCommand.args[0];
            const wagerAmount = parseInt(triggeredArg);

            if (currentQuestion) {
                if (currentQuestion.username === username) {
                    await TwitchApi.chat.sendChatMessage(`${user.displayName}, you already have a trivia question in progress!`, null, sendAsBot);
                    return;
                }
                await TwitchApi.chat.sendChatMessage(`${user.displayName}, someone else is currently answering a question. Please wait for them to finish.`, null, sendAsBot);
                return;
            }

            const cooldownExpireTime = cooldownCache.get(username);
            if (cooldownExpireTime && moment().isBefore(cooldownExpireTime)) {
                const timeRemainingDisplay = humanizeTime(Math.abs(moment().diff(cooldownExpireTime, 'seconds')));
                await TwitchApi.chat.sendChatMessage(`${user.displayName}, trivia is currently on cooldown for you. Time remaining: ${timeRemainingDisplay}`, null, sendAsBot);
                return;
            }

            if (wagerAmount < 1) {
                await TwitchApi.chat.sendChatMessage(`${user.displayName}, your wager amount must be more than 0.`, null, sendAsBot);
                return;
            }

            const minWager = triviaSettings.settings.currencySettings.minWager as number;
            if (minWager != null && minWager > 0) {
                if (wagerAmount < minWager) {
                    await TwitchApi.chat.sendChatMessage(`${user.displayName}, your wager amount must be at least ${minWager}.`, null, sendAsBot);
                    return;
                }
            }
            const maxWager = triviaSettings.settings.currencySettings.maxWager as number;
            if (maxWager != null && maxWager > 0) {
                if (wagerAmount > maxWager) {
                    await TwitchApi.chat.sendChatMessage(`${user.displayName}, your wager amount can be no more than ${maxWager}.`, null, sendAsBot);
                    return;
                }
            }

            const currencyId = triviaSettings.settings.currencySettings.currencyId as string;
            let userBalance;
            try {
                userBalance = await currencyManager.getViewerCurrencyAmount(username, currencyId);
            } catch (error) {
                logger.error((error as Error).message);
                userBalance = 0;
            }

            if (userBalance < wagerAmount) {
                await TwitchApi.chat.sendChatMessage(`${user.displayName}, you don't have enough to wager this amount!`, null, sendAsBot);
                return;
            }

            const question = await triviaHelper.getQuestion(
                triviaSettings.settings.questionSettings.enabledCategories as number[],
                triviaSettings.settings.questionSettings.enabledDifficulties as string[],
                triviaSettings.settings.questionSettings.enabledTypes as string[]
            );

            if (question == null) {
                await TwitchApi.chat.sendChatMessage(`Sorry ${user.displayName}, there was an issue finding you a trivia question. Your wager has not been deducted.`, null, sendAsBot);
                return;
            }

            const cooldownSecs = triviaSettings.settings.cooldownSettings.cooldown as number;
            if (cooldownSecs && cooldownSecs > 0) {
                const expireTime = moment().add(cooldownSecs, 'seconds');
                cooldownCache.set(username, expireTime, cooldownSecs);
            }

            try {
                await currencyManager.adjustCurrencyForViewerById(user.id, currencyId, 0 - Math.abs(wagerAmount));
            } catch (error) {
                logger.error((error as Error).message);
                await TwitchApi.chat.sendChatMessage(`Sorry ${user.displayName}, there was an error deducting currency from your balance so trivia has been canceled.`, null, sendAsBot);
                return;
            }

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

            // get the users winnings multiplier
            let winningsMultiplier = 1.25;

            const multiplierSettings = triviaSettings.settings.multiplierSettings as {
                easyMultipliers: RoleNumberParameterValue;
                mediumMultipliers: RoleNumberParameterValue;
                hardMultipliers: RoleNumberParameterValue;
            };

            let winningsMultiplierSettings: RoleNumberParameterValue;
            if (question.difficulty === "easy") {
                winningsMultiplierSettings = multiplierSettings.easyMultipliers;
            }
            if (question.difficulty === "medium") {
                winningsMultiplierSettings = multiplierSettings.mediumMultipliers;
            }
            if (question.difficulty === "hard") {
                winningsMultiplierSettings = multiplierSettings.hardMultipliers;
            }

            if (winningsMultiplierSettings) {
                winningsMultiplier = winningsMultiplierSettings.base;

                for (const role of winningsMultiplierSettings.roles) {
                    if (allRoles.some(r => r.id === role.roleId)) {
                        winningsMultiplier = role.value;
                        break;
                    }
                }
            }

            currentQuestion = {
                username: username,
                question: question,
                wager: wagerAmount,
                winningsMultiplier: winningsMultiplier,
                currencyId: currencyId,
                chatter: chatter,
                postCorrectAnswer: triviaSettings.settings.chatSettings.postCorrectAnswer as boolean
            };

            const answerTimeout = triviaSettings.settings.questionSettings.answerTime as number;

            const questionMessage = `@${user.displayName} trivia (${question.difficulty}): ${question.question} ${question.answers.map((v, i) => `${i + 1}) ${v}`).join(" ")} [Chat the correct answer # within ${answerTimeout} secs]`;

            await TwitchApi.chat.sendChatMessage(questionMessage, null, sendAsBot);

            fiveSecTimeoutId = setTimeout(async () => {
                if (currentQuestion == null || currentQuestion.username !== username) {
                    return;
                }
                await TwitchApi.chat.sendChatMessage(`@${user.displayName}, 5 seconds remaining to answer...`, null, sendAsBot);
            }, (answerTimeout - 6) * 1000);

            answerTimeoutId = setTimeout(async () => {
                if (currentQuestion == null || currentQuestion.username !== username) {
                    return;
                }
                await TwitchApi.chat.sendChatMessage(`@${user.displayName} did not provide an answer in time!`, null, sendAsBot);
                clearCurrentQuestion();
            }, answerTimeout * 1000);
        } else {
            const noWagerMessage = (triviaSettings.settings.chatSettings.noWagerMessage as string)
                .replaceAll("{user}", user.displayName);
            await TwitchApi.chat.sendChatMessage(noWagerMessage, null, sendAsBot);
        }
    }
};

function registerTriviaCommand(): void {
    if (!CommandManager.hasSystemCommand(TRIVIA_COMMAND_ID)) {
        CommandManager.registerSystemCommand(triviaCommand);
    }
}

function unregisterTriviaCommand(): void {
    CommandManager.unregisterSystemCommand(TRIVIA_COMMAND_ID);
}

function purgeCaches(): void {
    cooldownCache.flushAll();
    clearCurrentQuestion();
}

export default {
    purgeCaches,
    registerTriviaCommand,
    unregisterTriviaCommand
};