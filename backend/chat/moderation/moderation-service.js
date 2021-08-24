"use strict";

const { parentPort } = require("worker_threads");
const logger = require("../../logwrapper");

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

    return expressions.some(expression => {
        return input.split(" ").forEach(word => {
            expression.test(word);
        });
    });
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
    case "moderateMessage": {
        // check for banned word
        logger.debug("checking if we have a message...");
        if (event.message == null || event.messageId == null) return;
        if (event.scanForBannedWords) {
            logger.debug("checking for banned words...");
            let bannedWordFound = hasBannedWord(event.message);
            if (bannedWordFound) {
                logger.debug("banned word found");
                parentPort.postMessage({ type: "deleteMessage", messageId: event.messageId });
            } else {
                let bannedRegexMatched = matchesBannedRegex(event.message);
                if (bannedRegexMatched) {
                    logger.debug("regex found");
                    parentPort.postMessage({ type: "deleteMessage", messageId: event.messageId });
                }
            }
        }
        break;
    }
    }
});

