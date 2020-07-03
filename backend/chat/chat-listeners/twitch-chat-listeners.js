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
        const hostListener = require("../../events/twitch-events/host");
        hostListener.triggerHost(byChannel, auto, viewers);
    });

    streamerChatClient.onSub((_channel, _user, subInfo) => {
        const subListener = require("../../events/twitch-events/sub");
        subListener.triggerSub(subInfo.displayName, subInfo.planName, subInfo.months,
            subInfo.streak, subInfo.isPrime);
    });

    streamerChatClient.onResub((_channel, _username, subInfo) => {
        const subListener = require("../../events/twitch-events/sub");
        subListener.triggerSub(subInfo.displayName, subInfo.planName, subInfo.months,
            subInfo.streak, subInfo.isPrime);
    });

    streamerChatClient.onSubGift((channel, user, giftSubInfo, msg) => {
        const giftSubListener = require("../../events/twitch-events/gift-sub");
        giftSubListener.triggerSubGift(giftSubInfo.gifterDisplayName, giftSubInfo.displayName, giftSubInfo.gifterGiftCount, giftSubInfo.planName);
    });

    streamerChatClient.onRaid((_channel, _username, raidInfo, msg) => {
        const raidListener = require("../../events/twitch-events/raid");
        raidListener.triggerRaid(raidInfo.displayName, raidInfo.viewerCount);
    });

};