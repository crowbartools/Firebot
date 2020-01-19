"use strict";

const { parentPort } = require("worker_threads");

function escapeRegExp(input) {
    return input.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"); // eslint-disable-line no-useless-escape
}

let bannedWords = [];

function hasBannedWord(input) {
    return bannedWords
        .some((word) => {
            const wordExp = new RegExp(`\\b${escapeRegExp(word).replace(/(\W)/g, '\\$1')}\\b`, 'gi');
            return wordExp.test(input);
        });
}

parentPort.on("message", event => {
    if (event == null) return;
    console.log("Worker event: ", event);

    switch (event.type) {
    case "exit":
        parentPort.close();
        break;
    case "bannedWordsUpdate":
        bannedWords = event.words;
        break;
    case "moderateMessage": {
        // check for banned word
        if (event.message == null || event.messageId == null) return;
        if (event.scanForBannedWords) {
            let bannedWordFound = hasBannedWord(event.message);
            if (bannedWordFound) {
                parentPort.postMessage({ type: "deleteMessage", messageId: event.messageId });
            }
        }
        break;
    }
    }
});

