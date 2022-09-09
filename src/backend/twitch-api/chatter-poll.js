"use strict";

const logger = require("../logwrapper");
const accountAccess = require("../common/account-access");
const twitchApi = require("../twitch-api/api");
const activeChatUserHandler = require("../chat/chat-listeners/active-user-handler");

// every 5 mins
const POLL_INTERVAL = 300000;

let chatterPollIntervalId;
let pollIsRunning = false;

function clearPollInterval() {
    if (chatterPollIntervalId != null) {
        clearTimeout(chatterPollIntervalId);
    }
}

async function handleChatters() {
    if (pollIsRunning === true) {
        return;
    }

    pollIsRunning = true;

    try {
        const streamer = accountAccess.getAccounts().streamer;
        const client = twitchApi.getClient();

        if (client == null || !streamer.loggedIn) {
            return;
        }

        logger.debug("Getting connected chat users...");

        const chatters = await client.unsupported.getChatters(streamer.username);

        logger.debug(`There are ${chatters ? chatters.allChatters.length : 0} online chat users.`);

        if (chatters == null || chatters.allChatters.length < 1) {
            return;
        }

        for (const username of chatters.allChatters) {
            await activeChatUserHandler.addOnlineUser(username);
        }
    } catch (error) {
        logger.error("There was an error getting connected chat users", error);
    }

    pollIsRunning = false;
}

exports.startChatterPoll = () => {
    clearPollInterval();
    handleChatters();
    chatterPollIntervalId = setInterval(handleChatters, POLL_INTERVAL);
};

exports.stopChatterPoll = () => {
    clearPollInterval();
};

exports.runChatterPoll = async () => {
    await handleChatters();
};