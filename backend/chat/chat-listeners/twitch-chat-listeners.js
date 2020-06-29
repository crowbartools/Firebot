"use strict";

const frontendCommunicator = require("../../common/frontend-communicator");
const commandHandler = require("../commands/commandHandler");
const chatHelpers = require("../chat-helpers");

/** @arg {import('twitch-chat-client/lib/ChatClient').default} streamerChatClient */
exports.setupChatListeners = (streamerChatClient) => {
    streamerChatClient.onPrivmsg(async (_channel, _user, _message, msg) => {
        const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg);

        // send to the frontend
        frontendCommunicator.send("twitch:chat:message", firebotChatMessage);

        commandHandler.handleChatMessage(firebotChatMessage);
    });

    streamerChatClient.onWhisper(async (_user, _message, msg) => {
        const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, true);
        frontendCommunicator.send("twitch:chat:message", firebotChatMessage);
    });

    streamerChatClient.onAction(async (_channel, _user, _message, msg) => {
        const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, false, true);
        frontendCommunicator.send("twitch:chat:message", firebotChatMessage);
    });

    streamerChatClient.onAction(async (_channel, _user, _message, msg) => {
        const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, false, true);
        frontendCommunicator.send("twitch:chat:message", firebotChatMessage);
    });

    streamerChatClient.onHosted((_, byChannel, auto, viewers) => {
        const hostListener = require("../../events/twitch-listeners/host");
        hostListener.triggerHost(byChannel, auto, viewers);
    });

    streamerChatClient.onResub((channel, username, subInfo, msg) => {

    });

    streamerChatClient.onRaid((channel, username, raidInfo, msg) => {
    });
};