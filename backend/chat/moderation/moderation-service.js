"use strict";

const { parentPort } = require("worker_threads");

let bannedWords = new Set();
let regularExpressions = [];

let spamRaidProtectionEnabled = false;
let raidMessage = "";
const messageCache = [];

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
            if (expression.test(word)) {
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

const handleRaider = (message, shouldBan, shouldBlock) => {
    if (shouldBan) {
        parentPort.postMessage(
            {
                type: "banUser",
                username: message.username
            }
        );
    }

    if (shouldBlock) {
        parentPort.postMessage(
            {
                type: "blockUser",
                username: message.username
            }
        );
    }
};

const getRaidMessage = () => {
    const rawMessages = messageCache.map(message => message.rawText);
    const raidMessages = rawMessages.reduce((allMessages, message) => {
        if (allMessages[message] != null) {
            allMessages[message] += 1;
        } else {
            allMessages[message] = 1;
        }

        return allMessages;
    }, {});

    const counts = Object.values(raidMessages);

    const highest = Math.max(...counts);
    if (highest < 2) {
        return "";
    }

    const index = counts.findIndex(count => count === highest);

    return Object.keys(raidMessages)[index];
};

const checkPreviousMessages = (shouldBan, shouldBlock) => {
    if (!raidMessage) return;

    for (const message in messageCache) {
        if (messageCache[message].rawText === raidMessage) {
            handleRaider(messageCache[message], shouldBan, shouldBlock);
        }
    }
};

parentPort.on("message", event => {
    if (event == null) return;

    switch (event.type) {
    case "exit":
        parentPort.close();
        break;
    case "bannedWordsUpdate":
        bannedWords = new Set(event.words.map(word => word.toLowerCase().trim()));
        break;
    case "bannedRegexUpdate":
        regularExpressions = event.regularExpressions.map(exp => new RegExp(exp, 'i'));
        break;
    case "spamRaidProtectionEnable":
        raidMessage = getRaidMessage();
        checkPreviousMessages(event.shouldBan, event.shouldBlock);
        spamRaidProtectionEnabled = true;
        break;
    case "spamRaidProtectionDisable":
        spamRaidProtectionEnabled = false;
        raidMessage = "";
        break;
    case "moderateMessage": {
        if (event.chatMessage == null || event.settings == null || event.userIsExemptFor == null) return;
        const { chatMessage, userIsExemptFor, settings } = event;

        if (!userIsExemptFor.spamRaidProtection && settings.spamRaidProtection.cacheLimit) {
            const srpSettings = settings.spamRaidProtection;
            if (srpSettings.characterLimit && chatMessage.rawText.length > srpSettings.characterLimit) {
                chatMessage.rawText = chatMessage.rawText.substr(srpSettings.characterLimit);
            }

            if (messageCache.length >= srpSettings.cacheLimit) {
                messageCache.shift();
            }
            messageCache.push(chatMessage);

            if (spamRaidProtectionEnabled && chatMessage.rawText === raidMessage) {
                handleRaider(chatMessage, srpSettings.shouldBan, srpSettings.shouldBlock);
                return;
            }
        }

        if (settings.bannedWordList.enabled && !userIsExemptFor.bannedWords) {
            const bannedWordFound = hasBannedWord(chatMessage.rawText);
            if (bannedWordFound) {
                parentPort.postMessage(
                    {
                        type: "deleteMessage",
                        messageId: chatMessage.id,
                        logMessage: `Chat message with id '${chatMessage.id}' contains a banned word. Deleting...`
                    }
                );
                return;
            }

            const bannedRegexMatched = matchesBannedRegex(chatMessage.rawText);
            if (bannedRegexMatched) {
                parentPort.postMessage(
                    {
                        type: "deleteMessage",
                        messageId: chatMessage.id,
                        logMessage: `Chat message with id '${chatMessage.id}' contains a banned word. Deleting...`
                    }
                );
                return;
            }
        }

        if (settings.emoteLimit.enabled && !userIsExemptFor.emoteLimit) {
            const emoteCount = chatMessage.parts.filter(p => p.type === "emote").length;
            const emojiCount = chatMessage.parts
                .filter(p => p.type === "text")
                .reduce((acc, part) => acc + countEmojis(part.text), 0);
            if ((emoteCount + emojiCount) > settings.emoteLimit.max) {
                parentPort.postMessage(
                    {
                        type: "deleteMessage",
                        messageId: chatMessage.id,
                        logMessage: `Chat message with id '${chatMessage.id}' contains too many emotes. Deleting...`
                    }
                );
                return;
            }
        }

        if (settings.urlModeration.enabled && !userIsExemptFor.urls) {
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
                    outputMessage: outputMessage,
                    logMessage: `Chat message with id '${chatMessage.id}' contains a url. Deleting...`
                }
            );
        }
    }
    }
});

