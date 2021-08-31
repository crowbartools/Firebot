"use strict";

const logger = require("../../../../logwrapper");
const frontendCommunicator = require("../../../../common/frontend-communicator");
const profileManager = require("../../../../common/profile-manager");

let getBannedWordsDb = () => profileManager.getJsonDbInProfile("/chat/moderation/banned-words", false);
let getbannedRegularExpressionsDb = () => profileManager.getJsonDbInProfile("/chat/moderation/banned-regular-expressions", false);

let bannedWords = [];
let bannedRegularExpressions = [];

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
    logger.debug(bannedWords);
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
    let words = getBannedWordsDb().getData("/");

    if (words && Object.keys(words).length > 0) {
        bannedWords = words.words;
    }

    let regularExpressions = getbannedRegularExpressionsDb().getData("/");

    if (regularExpressions && Object.keys(regularExpressions).length > 0) {
        bannedRegularExpressions = regularExpressions;
    }
}

function moderate(chatMessage, settings, moderated) {
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
    bannedWords.push(words);
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
    bannedRegularExpressions.regularExpressions = bannedRegularExpressions.regularExpressions.concat(regularExpressions);
    saveBannedRegularExpressionsList();
});

frontendCommunicator.on("removeBannedRegularExpressions", regexText => {
    bannedRegularExpressions.regularExpressions = bannedRegularExpressions.regularExpressions.filter(r => r.text.toLowerCase() !== regexText);
    saveBannedRegularExpressionsList();
});

frontendCommunicator.on("removeAllRegularExpressions", () => {
    bannedRegularExpressions.regularExpressions = [];
    saveBannedRegularExpressionsList();
});

exports.moderate = moderate;
exports.load = load;
