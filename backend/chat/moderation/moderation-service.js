"use strict";

const { parentPort } = require("worker_threads");

let bannedWords = [];

function hasBannedWord(input) {
    input = input.toLowerCase();
    return bannedWords
        .some(word => {
            return input.split(" ").includes(word);
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

