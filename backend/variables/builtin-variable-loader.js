"use strict";

const replaceVariableManager = require("./replace-variable-manager");

exports.loadReplaceVariables = () => {
    // get variable definitions
    const user = require("./builtin/user");
    const subMonths = require("./builtin/subMonths");
    const arg = require("./builtin/arg");
    const target = require("./builtin/target");
    const count = require("./builtin/count");
    const bot = require("./builtin/bot");
    const streamer = require("./builtin/streamer");
    const date = require("./builtin/date");
    const time = require("./builtin/time");
    const game = require("./builtin/game");
    const title = require("./builtin/streamTitle");
    const readApi = require("./builtin/readApi");
    const userAvatarUrl = require("./builtin/userAvatarUrl");
    const readFile = require("./builtin/readFile");
    const fileLineCount = require('./builtin/fileLineCount');

    const patronageEarned = require("./builtin/patronageEarned");
    const patronageNextMilestoneReward = require("./builtin/patronageNextMilestoneReward");
    const patronageNextMilestoneTarget = require("./builtin/patronageNextMilestoneTarget");
    const patronagePreviousMilestoneReward = require("./builtin/patronagePreviousMilestoneReward");
    const patronagePreviousMilestoneTarget = require("./builtin/patronagePreviousMilestoneTarget");

    const commafy = require("./builtin/commafy");
    const ensureNumber = require("./builtin/ensureNumber");
    const math = require("./builtin/math");
    const randomNumber = require("./builtin/randomNumber");
    const randomViewer = require("./builtin/randomViewer");
    const randomActiveViewer = require('./builtin/randomActiveViewer');
    const currentViewerCount = require('./builtin/currentViewerCount');
    const activeChatUserCount = require('./builtin/activeChatUserCount');
    const quotes = require('./builtin/quote');
    const capitalize = require('./builtin/capitalize');
    const uppercase = require('./builtin/uppercase');
    const lowercase = require('./builtin/lowercase');
    const concat = require('./builtin/concat');
    const scrambleText = require('./builtin/scrambleText');
    const textLength = require('./builtin/textLength');

    const customVariable = require("./builtin/customVariable");
    const profilePageBytebinToken = require("./builtin/profilePageBytebinToken");

    const commandTrigger = require("./builtin/commandTrigger");
    const chatMessage = require('./builtin/chatMessage');

    const controlText = require("./builtin/controlText");
    const controlProgress = require("./builtin/controlProgress");
    const controlCost = require("./builtin/controlCost");
    const controlCooldown = require("./builtin/controlCooldown");
    const controlTooltip = require("./builtin/controlTooltip");
    const controlActiveState = require("./builtin/controlActiveState");
    const textboxInput = require ("./builtin/textboxInput");

    const skillName = require("./builtin/skill-name");
    const skillCost = require("./builtin/skill-cost");
    const skillCurrencyType = require("./builtin/skill-currency-type");
    const skillStickerUrl = require("./builtin/skill-sticker-url");
    const skillGifUrl = require("./builtin/skill-gif-url");

    const donationAmount = require("./builtin/donationAmount");
    const donationAmountFormatted = require("./builtin/donationAmountFormatted");
    const donationMessage = require("./builtin/donationMessage");
    const donationFrom = require("./builtin/donationFrom");

    const currency = require("./builtin/currency");
    const topCurrency = require("./builtin/topCurrency");

    const costreamChannels = require("./builtin/costream");

    const giftReceiverUsername = require("./builtin/gift-receiver-user");

    const userLevel = require("./builtin/user-level");
    const userNextLevelHearts = require("./builtin/user-next-level-hearts");
    const userTotalHearts = require("./builtin/user-total-hearts");
    const userRankBadgeUrl = require("./builtin/user-rank-badge-url");

    const viewTime = require("./builtin/viewTime");
    const mixplayInteractions = require("./builtin/mixplayInteractions");
    const chatMessages = require("./builtin/chatMessages");

    // register them
    replaceVariableManager.registerReplaceVariable(user);
    replaceVariableManager.registerReplaceVariable(subMonths);
    replaceVariableManager.registerReplaceVariable(arg);
    replaceVariableManager.registerReplaceVariable(target);
    replaceVariableManager.registerReplaceVariable(count);
    replaceVariableManager.registerReplaceVariable(bot);
    replaceVariableManager.registerReplaceVariable(streamer);
    replaceVariableManager.registerReplaceVariable(date);
    replaceVariableManager.registerReplaceVariable(time);
    replaceVariableManager.registerReplaceVariable(game);
    replaceVariableManager.registerReplaceVariable(title);
    replaceVariableManager.registerReplaceVariable(readApi);
    replaceVariableManager.registerReplaceVariable(userAvatarUrl);
    replaceVariableManager.registerReplaceVariable(readFile);
    replaceVariableManager.registerReplaceVariable(fileLineCount);

    replaceVariableManager.registerReplaceVariable(patronageEarned);
    replaceVariableManager.registerReplaceVariable(patronageNextMilestoneReward);
    replaceVariableManager.registerReplaceVariable(patronageNextMilestoneTarget);
    replaceVariableManager.registerReplaceVariable(patronagePreviousMilestoneReward);
    replaceVariableManager.registerReplaceVariable(patronagePreviousMilestoneTarget);

    replaceVariableManager.registerReplaceVariable(commafy);
    replaceVariableManager.registerReplaceVariable(ensureNumber);
    replaceVariableManager.registerReplaceVariable(math);
    replaceVariableManager.registerReplaceVariable(randomNumber);
    replaceVariableManager.registerReplaceVariable(randomViewer);
    replaceVariableManager.registerReplaceVariable(randomActiveViewer);
    replaceVariableManager.registerReplaceVariable(currentViewerCount);
    replaceVariableManager.registerReplaceVariable(activeChatUserCount);
    replaceVariableManager.registerReplaceVariable(quotes);
    replaceVariableManager.registerReplaceVariable(capitalize);
    replaceVariableManager.registerReplaceVariable(uppercase);
    replaceVariableManager.registerReplaceVariable(lowercase);
    replaceVariableManager.registerReplaceVariable(concat);
    replaceVariableManager.registerReplaceVariable(scrambleText);
    replaceVariableManager.registerReplaceVariable(textLength);

    replaceVariableManager.registerReplaceVariable(customVariable);
    replaceVariableManager.registerReplaceVariable(profilePageBytebinToken);

    replaceVariableManager.registerReplaceVariable(commandTrigger);
    replaceVariableManager.registerReplaceVariable(chatMessage);

    replaceVariableManager.registerReplaceVariable(controlText);
    replaceVariableManager.registerReplaceVariable(controlProgress);
    replaceVariableManager.registerReplaceVariable(controlCost);
    replaceVariableManager.registerReplaceVariable(controlCooldown);
    replaceVariableManager.registerReplaceVariable(controlTooltip);
    replaceVariableManager.registerReplaceVariable(controlActiveState);

    replaceVariableManager.registerReplaceVariable(textboxInput);

    replaceVariableManager.registerReplaceVariable(skillName);
    replaceVariableManager.registerReplaceVariable(skillCost);
    replaceVariableManager.registerReplaceVariable(skillCurrencyType);
    replaceVariableManager.registerReplaceVariable(skillStickerUrl);
    replaceVariableManager.registerReplaceVariable(skillGifUrl);

    replaceVariableManager.registerReplaceVariable(donationAmount);
    replaceVariableManager.registerReplaceVariable(donationAmountFormatted);
    replaceVariableManager.registerReplaceVariable(donationMessage);
    replaceVariableManager.registerReplaceVariable(donationFrom);

    replaceVariableManager.registerReplaceVariable(currency);
    replaceVariableManager.registerReplaceVariable(topCurrency);

    replaceVariableManager.registerReplaceVariable(costreamChannels);

    replaceVariableManager.registerReplaceVariable(giftReceiverUsername);

    replaceVariableManager.registerReplaceVariable(userLevel);
    replaceVariableManager.registerReplaceVariable(userNextLevelHearts);
    replaceVariableManager.registerReplaceVariable(userRankBadgeUrl);
    replaceVariableManager.registerReplaceVariable(userTotalHearts);

    replaceVariableManager.registerReplaceVariable(viewTime);
    replaceVariableManager.registerReplaceVariable(mixplayInteractions);
    replaceVariableManager.registerReplaceVariable(chatMessages);
};
