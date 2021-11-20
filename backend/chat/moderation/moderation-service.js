"use strict";

const { parentPort } = require("worker_threads");

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
    if (event == null) {
        return;
    }

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
    case "moderateMessage": {
        // check for banned word
        if (event.message == null || event.messageId == null) {
            return;
        }
        if (event.scanForBannedWords) {
            let bannedWordFound = hasBannedWord(event.message);
            if (bannedWordFound) {
                parentPort.postMessage({ type: "deleteMessage", messageId: event.messageId });
            } else {
                let bannedRegexMatched = matchesBannedRegex(event.message);
                if (bannedRegexMatched) {
                    parentPort.postMessage({ type: "deleteMessage", messageId: event.messageId });
                }
            }
        }
        break;
    }
    }
});

