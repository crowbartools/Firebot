"use strict";

const accountAccess = require("../common/account-access");

const twitchApi = require("./api");

// every 5 mins
const POLL_INTERVAL = 300000;

let chatterPollIntervalId;

function clearPollInterval() {
    if (chatterPollIntervalId != null) {
        clearTimeout(chatterPollIntervalId);
    }
}

async function handleChatters() {
    const streamer = accountAccess.getAccounts().streamer;
    const client = twitchApi.getClient();

    if (client == null || !streamer.loggedIn) return;

    const logger = require("../logwrapper");

    logger.debug("Getting connected chat users...");

    const chatters = await client.unsupported.getChatters(streamer.username);

    logger.debug(`There are ${chatters ? chatters.allChatters.length : 0} online chat users.`);

    if (chatters == null || chatters.allChatters.length < 1) return;

    const activeChatUserHandler = require("../chat/chat-listeners/active-user-handler");

    for (const username of chatters.allChatters) {
        await activeChatUserHandler.addOnlineUser(username);
    }
}

exports.startChatterPoll = () => {
    clearPollInterval();
    handleChatters();
    chatterPollIntervalId = setInterval(handleChatters, POLL_INTERVAL);
};

exports.stopChatterPoll = () => {
    clearPollInterval();
};