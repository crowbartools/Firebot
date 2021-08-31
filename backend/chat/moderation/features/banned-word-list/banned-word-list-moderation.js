"use strict";

const { parentPort } = require("worker_threads");
const chat = require("../../../twitch-chat");
const logger = require("../../../../logwrapper");

let bannedWords = [];
let regularExpressions = [];

function hasBannedWord(input) {
    input = input.toLowerCase();
    return bannedWords
        .some(word => {
            return input.split(" ").includes(word);
        });
}

function matchesBannedRegex(input) {
    let expressions = regularExpressions.map(regex => new RegExp(regex, "gi"));
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

parentPort.on("message", event => {
    if (event == null) return;

    switch (event.type) {
    case "exit":
        parentPort.close();
        break;
    case "bannedWordsUpdate":
        bannedWords = event.words;
        break;
    case "bannedRegexUpdate":
        regularExpressions = event.regularExpressions;
        break;
    }
});

function moderate(chatMessage, settings, moderated) {
    const message = chatMessage.rawText;

    let bannedWordFound = hasBannedWord(message);
    let bannedRegexMatched = matchesBannedRegex(message);

    if (bannedWordFound || bannedRegexMatched) {
        chat.deleteMessage(chatMessage.id);
        logger.debug(`Chat message with id '${chatMessage.id}' contains a banned word. Deleting...`);
        moderated(true);
    }

    moderated(false);
}

exports.moderate = moderate;

