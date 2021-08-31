"use strict";

const logger = require("../../../../logwrapper");
const frontendCommunicator = require("../../../../common/frontend-communicator");
const profileManager = require("../../../../common/profile-manager");
const rolesManager = require("../../../../roles/custom-roles-manager");

let getBannedWordsDb = () => profileManager.getJsonDbInProfile("/chat/moderation/banned-words", false);
let getbannedRegularExpressionsDb = () => profileManager.getJsonDbInProfile("/chat/moderation/banned-regular-expressions", false);

let bannedWords = [];
let bannedRegularExpressions = [];

function getBannedWordsList() {
    let words = getBannedWordsDb().getData("/");

    if (words && Object.keys(words).length > 0) {
        return words.words;
    }
}

function getBannedRegularExpressions() {
    let regularExpressions = getbannedRegularExpressionsDb().getData("/");

    if (regularExpressions && Object.keys(regularExpressions).length > 0) {
        return regularExpressions.regularExpressions;
    }
}

function saveBannedWordList() {
    try {
        getBannedWordsDb().push("/", bannedWords);
    } catch (error) {
        if (error.name === 'DatabaseError') {
            logger.error("Error saving banned words data", error);
        }
    }
}

function saveBannedRegularExpressionsList() {
    try {
        getbannedRegularExpressionsDb().push("/", bannedRegularExpressions);
    } catch (error) {
        if (error.name === 'DatabaseError') {
            logger.error("Error saving banned regular expressions data", error);
        }
    }
}


function hasBannedWord(input) {
    input = input.toLowerCase();
    return bannedWords
        .some(word => {
            return input.split(" ").includes(word.text);
        });
}

function matchesBannedRegex(input) {
    let expressions = bannedRegularExpressions.regularExpressions.map(regex => new RegExp(regex, "gi"));
    let inputWords = input.split(" ");

    for (const exp of expressions) {
        for (const word of inputWords) {
            if (exp.test(word)) {
                return true;
            }
        }
    }

    return false;
}

function load() {
    bannedWords = getBannedWordsList();
    bannedRegularExpressions = getBannedRegularExpressions();
}

function moderate(chatMessage, settings, moderated) {
    const userExempt = rolesManager.userIsInRole(chatMessage.username, chatMessage.roles, settings.exemptRoles);

    if (userExempt) {
        moderated(false);
        return;
    }

    const message = chatMessage.rawText;

    const bannedWordFound = hasBannedWord(message);
    const bannedRegexMatched = matchesBannedRegex(message);

    if (bannedWordFound || bannedRegexMatched) {
        const chat = require("../../../twitch-chat");
        chat.deleteMessage(chatMessage.id);
        logger.debug(`Chat message with id '${chatMessage.id}' contains a banned word. Deleting...`);
        moderated(true);
        return;
    }

    moderated(false);
}

frontendCommunicator.on("addBannedWords", words => {
    bannedWords = bannedWords.concat(words);
    saveBannedWordList();
});

frontendCommunicator.on("removeBannedWord", wordText => {
    bannedWords = bannedWords.filter(w => w.text.toLowerCase() !== wordText);
    saveBannedWordList();
});

frontendCommunicator.on("removeAllBannedWords", () => {
    bannedWords = [];
    saveBannedWordList();
});

frontendCommunicator.on("addBannedRegularExpressions", regularExpressions => {
    bannedRegularExpressions = bannedRegularExpressions.concat(regularExpressions);
    saveBannedRegularExpressionsList();
});

frontendCommunicator.on("removeBannedRegularExpressions", regexText => {
    bannedRegularExpressions = bannedRegularExpressions.filter(r => r.text.toLowerCase() !== regexText);
    saveBannedRegularExpressionsList();
});

frontendCommunicator.on("removeAllRegularExpressions", () => {
    bannedRegularExpressions = [];
    saveBannedRegularExpressionsList();
});

exports.moderate = moderate;
exports.load = load;
exports.getBannedWordsList = getBannedWordsList;
exports.getBannedRegularExpressions = getBannedRegularExpressions;