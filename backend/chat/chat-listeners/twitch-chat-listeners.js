"use strict";

const frontendCommunicator = require("../../common/frontend-communicator");
const commandHandler = require("../commands/commandHandler");
const chatHelpers = require("../chat-helpers");
const activeUserHandler = require("./active-user-handler");


/** @arg {import('twitch-chat-client/lib/ChatClient').default} botChatClient */
exports.setupBotChatListeners = (botChatClient) => {
    botChatClient.onWhisper(async (_user, messageText, msg) => {
        const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, messageText, true);
        commandHandler.handleChatMessage(firebotChatMessage);
    });
};

/** @arg {import('twitch-chat-client/lib/ChatClient').default} streamerChatClient */
exports.setupChatListeners = (streamerChatClient) => {
    streamerChatClient.onPrivmsg(async (_channel, _user, messageText, msg) => {

        const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, messageText);

        // send to the frontend
        frontendCommunicator.send("twitch:chat:message", firebotChatMessage);

        commandHandler.handleChatMessage(firebotChatMessage);

        activeUserHandler.addActiveUser(msg.userInfo);

        const viewerArrivedListener = require("../../events/twitch-events/viewer-arrived");
        viewerArrivedListener.triggerViewerArrived(msg.userInfo.displayName);

        if (msg.isCheer) {
            const cheerListener = require("../../events/twitch-events/cheer");
            cheerListener.triggerCheer(msg.userInfo.displayName, msg.totalBits, msg.params.message);
        }
    });

    streamerChatClient.onWhisper(async (_user, messageText, msg) => {
        const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, messageText, true);

        commandHandler.handleChatMessage(firebotChatMessage);

        frontendCommunicator.send("twitch:chat:message", firebotChatMessage);
    });

    streamerChatClient.onAction(async (_channel, _user, messageText, msg) => {
        const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, messageText, false, true);
        frontendCommunicator.send("twitch:chat:message", firebotChatMessage);
    });

    streamerChatClient.onHosted((_, byChannel, auto, viewers) => {
        const hostListener = require("../../events/twitch-events/host");
        hostListener.triggerHost(byChannel, auto, viewers);
    });

    streamerChatClient.onSub((_channel, _user, subInfo) => {
        const subListener = require("../../events/twitch-events/sub");
        subListener.triggerSub(subInfo.displayName, subInfo.plan, subInfo.planName, subInfo.months,
            subInfo.streak, subInfo.isPrime);
    });

    streamerChatClient.onResub((_channel, _username, subInfo) => {
        const subListener = require("../../events/twitch-events/sub");
        subListener.triggerSub(subInfo.displayName, subInfo.plan, subInfo.planName, subInfo.months,
            subInfo.streak, subInfo.isPrime, true);
    });

    streamerChatClient.onSubGift((_channel, _user, giftSubInfo) => {
        const giftSubListener = require("../../events/twitch-events/gift-sub");
        giftSubListener.triggerSubGift(giftSubInfo.gifterDisplayName, giftSubInfo.displayName,
            giftSubInfo.gifterGiftCount, giftSubInfo.plan, giftSubInfo.planName, giftSubInfo.months);
    });

    streamerChatClient.onRaid((_channel, _username, raidInfo) => {
        const raidListener = require("../../events/twitch-events/raid");
        raidListener.triggerRaid(raidInfo.displayName, raidInfo.viewerCount);
    });
};