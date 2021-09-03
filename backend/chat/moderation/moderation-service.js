"use strict";

const { parentPort } = require("worker_threads");

let bannedWords = [];
let regularExpressions = [];

const hasBannedWord = (input) => {
    input = input.toLowerCase();
    return bannedWords
        .some(word => {
            return input.split(" ").includes(word);
        });
};

const matchesBannedRegex = (input) => {
    const expressions = regularExpressions.map(regex => new RegExp(regex, "gi"));
    const inputWords = input.split(" ");

    for (const exp of expressions) {
        for (const word of inputWords) {
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
                const viewerViewTime = event.viewer.minutesInChannel / 60;
                const minimumViewTime = settings.urlModeration.viewTime.viewTimeInHours;

                if (viewerViewTime <= minimumViewTime) return;
                outputMessage = outputMessage.replace("{viewTime}", minimumViewTime.toString());
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

