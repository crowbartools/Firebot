"use strict";
const ChatClient = require('twitch-chat-client').default;

const twitchClient = require("../twitch-api/client");

const accountAccess = require("../common/account-access");

async function connect() {

    const streamer = accountAccess.getAccounts().streamer;
    if (!streamer.loggedIn) return;

    const client = twitchClient.getClient();
    if (client == null) return;

    const chatClient = await ChatClient.forTwitchClient(client);

    chatClient.onRegister(() => chatClient.join(streamer.username));

    // listen to more events...
    await chatClient.connect();
}