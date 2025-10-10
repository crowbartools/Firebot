"use strict";

const frontendCommunicator = require("../../common/frontend-communicator");
const chatCommandHandler = require("../commands/chat-command-handler");
const chatHelpers = require("../chat-helpers");
const twitchEventsHandler = require("../../events/twitch-events");

const events = require("events");

exports.events = new events.EventEmitter();

/** @arg {import('@twurple/chat').ChatClient} botChatClient */
exports.setupBotChatListeners = (botChatClient) => {
    botChatClient.onWhisper(async (_user, messageText, msg) => {
        const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, messageText, true);
        chatCommandHandler.handleChatMessage(firebotChatMessage);
    });
};


/**
 * @arg {import('@twurple/chat').ChatClient} streamerChatClient
 * @arg {import('@twurple/chat').ChatClient} botChatClient
 */
exports.setupChatListeners = (streamerChatClient, botChatClient) => {
    const whisperHandler = async (_user, messageText, msg, accountType) => {
        const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, messageText, true);

        chatCommandHandler.handleChatMessage(firebotChatMessage);

        frontendCommunicator.send("twitch:chat:message", firebotChatMessage);

        twitchEventsHandler.whisper.triggerWhisper(
            msg.userInfo.userName,
            msg.userInfo.userId,
            msg.userInfo.displayName,
            messageText,
            accountType
        );
    };

    streamerChatClient.onWhisper(async (_user, messageText, msg) => whisperHandler(_user, messageText, msg, "streamer"));
    botChatClient?.onWhisper(async (_user, messageText, msg) => whisperHandler(_user, messageText, msg, "bot"));
};