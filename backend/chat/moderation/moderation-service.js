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
    case "moderateBannedWords": {
        // check for banned word
        if (event.message == null || event.messageId == null) return;
        let bannedWordFound = hasBannedWord(event.message);
        if (bannedWordFound) {
            parentPort.postMessage(
                {
                    type: "deleteMessage",
                    messageId: event.messageId
                }
            );
        } else {
            let bannedRegexMatched = matchesBannedRegex(event.message);
            if (bannedRegexMatched) {
                parentPort.postMessage(
                    {
                        type: "deleteMessage",
                        messageId: event.messageId
                    }
                );
            }
        }
        break;
    }
    case "moderateEmoteLimit": {
        const emoteCount = event.chatMessage.parts.filter(p => p.type === "emote").length;
        const emojiCount = event.chatMessage.parts
            .filter(p => p.type === "text")
            .reduce((acc, part) => acc + countEmojis(part.text), 0);
        if ((emoteCount + emojiCount) > event.emoteMax) {
            parentPort.postMessage(
                {
                    type: "deleteMessage",
                    messageId: event.chatMessage.id
                }
            );
            return;
        }
        break;
    }
    case "moderateUrls": {
        const { chatMessage, viewer, settings } = event;
        let outputMessage = settings.outputMessage;

        const regex = new RegExp(/[\w]{2,}[.][\w]{2,}/, "gi");
        if (!regex.test(chatMessage.rawText)) return;

        if (Object.keys(viewer).length > 0) {
            const viewerViewTime = viewer.minutesInChannel / 60;
            const minimumViewTime = settings.viewTime.viewTimeInHours;

            if (viewerViewTime <= minimumViewTime) {
                outputMessage = outputMessage.replace("{viewTime}", minimumViewTime.toString());
            } else {
                return;
            }
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
        break;
    }
    }
});

