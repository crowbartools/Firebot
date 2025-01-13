import util from "../../../utility";
import twitchChat from "../../../chat/twitch-chat";
import twitchListeners from "../../../chat/chat-listeners/twitch-chat-listeners";
import commandManager from "../../../chat/commands/command-manager";
import gameManager from "../../game-manager";
import currencyAccess from "../../../currency/currency-access";
import currencyManager from "../../../currency/currency-manager";
import customRolesManager from "../../../roles/custom-roles-manager";
import teamRolesManager from "../../../roles/team-roles-manager";
import twitchRolesManager from "../../../../shared/twitch-roles";
import { FirebotChatMessage } from "../../../../types/chat";
import { SystemCommand } from "../../../../types/commands";
import { GameSettings } from "../../../../types/game-manager";
import logger from "../../../logwrapper";
import triviaHelper from "./trivia-helper";
import { TriviaSettings } from "./trivia-settings";
import moment from "moment";
import NodeCache from "node-cache";

type TriviaQuestion = {
    username: string;
    question: {
        answers: string[];
        correctIndex: number;
    };
    wager: number;
    winningsMultiplier: number;
    currencyId: string;
    chatter: "Streamer" | "Bot";
    postCorrectAnswer: boolean;
};

let fiveSecTimeoutId: NodeJS.Timeout | null = null;
let answerTimeoutId: NodeJS.Timeout | null = null;
let currentQuestion: TriviaQuestion | null = null;

function clearCurrentQuestion() {
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

async function onChatMessage(chatMessage: FirebotChatMessage) {
    if (!currentQuestion) {
        return;
    }
    const { username, question, wager, winningsMultiplier, currencyId, chatter, postCorrectAnswer } = currentQuestion;
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

        await twitchChat.sendChatMessage(`${chatMessage.userDisplayName ?? username}, that is correct! You have won ${
            util.commafy(winnings)} ${currency.name}`, null, chatter);
    } else {
        await twitchChat.sendChatMessage(`Sorry ${chatMessage.userDisplayName ?? username}, that is incorrect.${
            postCorrectAnswer ? ` The correct answer was ${question.answers[question.correctIndex - 1]}.` : ""
        } Better luck next time!`, null, chatter);
    }
    clearCurrentQuestion();
}

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

        const triviaSettings = gameManager.getGameSettings("firebot-trivia") as GameSettings<TriviaSettings>;
        const chatter = triviaSettings.settings.chatSettings.chatter;

        const username = userCommand.commandSender;
        const user = {
            displayName: event.chatMessage.userDisplayName ?? username,
            id: event.chatMessage.userId
        };

        if (event.userCommand.subcommandId === "wagerAmount") {
            const triggeredArg = userCommand.args[0];
            const wagerAmount = parseInt(triggeredArg);

            if (currentQuestion) {
                if (currentQuestion.username === username) {
                    await twitchChat.sendChatMessage(`${user.displayName}, you already have a trivia question in progress!`, null, chatter);
                    return;
                }
                await twitchChat.sendChatMessage(`${user.displayName}, someone else is currently answering a question. Please wait for them to finish.`, null, chatter);
                return;
            }

            const cooldownExpireTime = cooldownCache.get(username);
            if (cooldownExpireTime && moment().isBefore(cooldownExpireTime)) {
                const timeRemainingDisplay = util.secondsForHumans(Math.abs(moment().diff(cooldownExpireTime, 'seconds')));
                await twitchChat.sendChatMessage(`${user.displayName}, trivia is currently on cooldown for you. Time remaining: ${timeRemainingDisplay}`, null, chatter);
                return;
            }

            if (wagerAmount < 1) {
                await twitchChat.sendChatMessage(`${user.displayName}, your wager amount must be more than 0.`, null, chatter);
                return;
            }

            const minWager = triviaSettings.settings.currencySettings.minWager;
            if (minWager != null && minWager > 0) {
                if (wagerAmount < minWager) {
                    await twitchChat.sendChatMessage(`${user.displayName}, your wager amount must be at least ${minWager}.`, null, chatter);
                    return;
                }
            }
            const maxWager = triviaSettings.settings.currencySettings.maxWager;
            if (maxWager != null && maxWager > 0) {
                if (wagerAmount > maxWager) {
                    await twitchChat.sendChatMessage(`${user.displayName}, your wager amount can be no more than ${maxWager}.`, null, chatter);
                    return;
                }
            }

            const currencyId = triviaSettings.settings.currencySettings.currencyId;
            let userBalance;
            try {
                userBalance = await currencyManager.getViewerCurrencyAmount(username, currencyId);
            } catch (error) {
                logger.error(error.message);
                userBalance = 0;
            }

            if (userBalance < wagerAmount) {
                await twitchChat.sendChatMessage(`${user.displayName}, you don't have enough to wager this amount!`, null, chatter);
                return;
            }

            const question = await triviaHelper.getQuestion(
                triviaSettings.settings.questionSettings.enabledCategories,
                triviaSettings.settings.questionSettings.enabledDifficulties,
                triviaSettings.settings.questionSettings.enabledTypes
            );

            if (question == null) {
                await twitchChat.sendChatMessage(`Sorry ${user.displayName}, there was an issue finding you a trivia question. Your wager has not been deducted.`, null, chatter);
                return;
            }

            const cooldownSecs = triviaSettings.settings.cooldownSettings.cooldown;
            if (cooldownSecs && cooldownSecs > 0) {
                const expireTime = moment().add(cooldownSecs, 'seconds');
                cooldownCache.set(username, expireTime, cooldownSecs);
            }

            try {
                await currencyManager.adjustCurrencyForViewerById(user.id, currencyId, 0 - Math.abs(wagerAmount));
            } catch (error) {
                logger.error(error.message);
                await twitchChat.sendChatMessage(`Sorry ${user.displayName}, there was an error deducting currency from your balance so trivia has been canceled.`, null, chatter);
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

            const multiplierSettings = triviaSettings.settings.multiplierSettings;

            let winningsMultiplierSettings;
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
                postCorrectAnswer: triviaSettings.settings.chatSettings.postCorrectAnswer
            };

            const answerTimeout = triviaSettings.settings.questionSettings.answerTime;

            const questionMessage = `@${user.displayName} trivia (${question.difficulty}): ${question.question} ${question.answers.map((v, i) => `${i + 1}) ${v}`).join(" ")} [Chat the correct answer # within ${answerTimeout} secs]`;

            await twitchChat.sendChatMessage(questionMessage, null, chatter);

            fiveSecTimeoutId = setTimeout(async () => {
                if (currentQuestion == null || currentQuestion.username !== username) {
                    return;
                }
                await twitchChat.sendChatMessage(`@${user.displayName}, 5 seconds remaining to answer...`, null, chatter);
            }, (answerTimeout - 6) * 1000);

            answerTimeoutId = setTimeout(async () => {
                if (currentQuestion == null || currentQuestion.username !== username) {
                    return;
                }
                await twitchChat.sendChatMessage(`@${user.displayName} did not provide an answer in time!`, null, chatter);
                clearCurrentQuestion();
            }, answerTimeout * 1000);
        } else {
            const noWagerMessage = triviaSettings.settings.chatSettings.noWagerMessage
                .replace("{user}", user.displayName);
            await twitchChat.sendChatMessage(noWagerMessage, null, chatter);
        }
    }
};

function registerTriviaCommand() {
    if (!commandManager.hasSystemCommand(TRIVIA_COMMAND_ID)) {
        commandManager.registerSystemCommand(triviaCommand);
        twitchListeners.events.addListener<FirebotChatMessage>("chat-message", onChatMessage);
    }
}

function unregisterTriviaCommand() {
    if (commandManager.hasSystemCommand(TRIVIA_COMMAND_ID)) {
        commandManager.unregisterSystemCommand(TRIVIA_COMMAND_ID);
        twitchListeners.events.removeListener<FirebotChatMessage>("chat-message", onChatMessage);
    }
}

function purgeCaches() {
    cooldownCache.flushAll();
    clearCurrentQuestion();
}

export default {
    purgeCaches,
    registerTriviaCommand,
    unregisterTriviaCommand
};
