"use strict";

const { parentPort } = require("worker_threads");

let bannedWords = [];
let regularExpressions = [];

const hasBannedWord = (input) => {
    return input
        .toLowerCase()
        .split(/\s+/g)
        .some(word => bannedWords.has(word));
};

const matchesBannedRegex = (input) => {
    const inputWords = input.split(/\s+/g);
    const uniqueWords = [...(new Set(inputWords))];

    for (const word of uniqueWords) {
        for (const expression of regularExpressions) {
            const exp = new RegExp(expression, 'i');

            if (exp.test(word)) {
                return true;
            }
        }
    }

    return false;
};

const countEmojis = (str) => {
    const re = /\p{Extended_Pictographic}/ug; //eslint-disable-line
    return ((str || '').match(re) || []).length;
};

const hasEnoughViewTime = (viewer, minimumViewTime) => {
    return (viewer.minutesInChannel / 60) >= minimumViewTime;
};

parentPort.on("message", event => {
    if (event == null) return;

    switch (event.type) {
    case "exit":
        parentPort.close();
        break;
    case "bannedWordsUpdate":
        bannedWords = new Set(event.words);
        break;
    case "bannedRegexUpdate":
        regularExpressions = event.regularExpressions;
        break;
    case "moderateMessage": {
        if (event.chatMessage == null || event.settings == null || event.userIsExemptFor == null) return;
        const { chatMessage, userIsExemptFor, settings } = event;

        if (!userIsExemptFor.bannedWords) {
            const bannedWordFound = hasBannedWord(chatMessage.rawText);
            if (bannedWordFound) {
                parentPort.postMessage(
                    {
                        type: "deleteMessage",
                        messageId: chatMessage.id
                    }
                );
                return;
            }

            const bannedRegexMatched = matchesBannedRegex(chatMessage.rawText);
            if (bannedRegexMatched) {
                parentPort.postMessage(
                    {
                        type: "deleteMessage",
                        messageId: chatMessage.id
                    }
                );
                return;
            }
        }

        if (!userIsExemptFor.emoteLimit) {
            const emoteCount = chatMessage.parts.filter(p => p.type === "emote").length;
            const emojiCount = chatMessage.parts
                .filter(p => p.type === "text")
                .reduce((acc, part) => acc + countEmojis(part.text), 0);
            if ((emoteCount + emojiCount) > settings.emoteLimit.max) {
                parentPort.postMessage(
                    {
                        type: "deleteMessage",
                        messageId: chatMessage.id
                    }
                );
                return;
            }
        }

        if (!userIsExemptFor.urls) {
            let outputMessage = settings.urlModeration.outputMessage;

            const regex = new RegExp(/[\w]{2,}[.][\w]{2,}/, "gi");
            if (!regex.test(chatMessage.rawText)) return;

            if (Object.keys(event.viewer).length > 0) {
                if (hasEnoughViewTime(event.viewer, settings.urlModeration.minimumViewTime)) return;

                outputMessage = outputMessage.replace("{viewTime}", settings.urlModeration.minimumViewTime.toString());
            }

            if (outputMessage) {
                outputMessage = outputMessage.replace("{userName}", chatMessage.username);
            }

            parentPort.postMessage(
                {
                    type: "deleteMessage",
                    messageId: chatMessage.id,
                    outputMessage: outputMessage
                }
            );
        }
    }
    }
});

