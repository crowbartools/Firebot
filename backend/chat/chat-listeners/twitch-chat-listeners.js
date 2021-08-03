"use strict";

const frontendCommunicator = require("../../common/frontend-communicator");
const commandHandler = require("../commands/commandHandler");
const chatHelpers = require("../chat-helpers");
const activeUserHandler = require("./active-user-handler");
const accountAccess = require("../../common/account-access");
const chatModerationManager = require("../moderation/chat-moderation-manager");
const twitchEventsHandler = require("../../events/twitch-events");
const logger = require("../../logwrapper");

const events = require("events");

exports.events = new events.EventEmitter();

/** @arg {import('twitch-chat-client/lib/ChatClient').default} botChatClient */
exports.setupBotChatListeners = (botChatClient) => {
    botChatClient.onWhisper(async (_user, messageText, msg) => {
        const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, messageText, true);
        commandHandler.handleChatMessage(firebotChatMessage);
    });
};

const HIGHLIGHT_MESSAGE_REWARD_ID = "highlight-message";

/** @arg {import('twitch-chat-client/lib/ChatClient').ChatClient} streamerChatClient */
exports.setupChatListeners = (streamerChatClient) => {
    streamerChatClient.onPrivmsg(async (_channel, user, messageText, msg) => {
        const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, messageText);

        await chatModerationManager.moderateMessage(firebotChatMessage);

        // send to the frontend
        if (firebotChatMessage.isHighlighted) {
            firebotChatMessage.customRewardId = HIGHLIGHT_MESSAGE_REWARD_ID;
            frontendCommunicator.send("twitch:chat:rewardredemption", {
                id: HIGHLIGHT_MESSAGE_REWARD_ID,
                messageText: firebotChatMessage.rawText,
                user: {
                    id: firebotChatMessage.userId,
                    username: firebotChatMessage.username
                },
                reward: {
                    id: HIGHLIGHT_MESSAGE_REWARD_ID,
                    name: "Highlight Message",
                    cost: 0,
                    imageUrl: "https://static-cdn.jtvnw.net/automatic-reward-images/highlight-4.png"
                }
            });
        }
        frontendCommunicator.send("twitch:chat:message", firebotChatMessage);
        exports.events.emit("chat-message", firebotChatMessage);

        commandHandler.handleChatMessage(firebotChatMessage);

        activeUserHandler.addActiveUser(msg.userInfo, true);

        twitchEventsHandler.viewerArrived.triggerViewerArrived(msg.userInfo.displayName);

        const { streamer, bot } = accountAccess.getAccounts();
        if (user !== streamer.username && user !== bot.username) {
            const timerManager = require("../../timers/timer-manager");
            timerManager.incrementChatLineCounters();
        }

        twitchEventsHandler.chatMessage.triggerChatMessage(firebotChatMessage);
    });

    streamerChatClient.onWhisper(async (_user, messageText, msg) => {
        const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, messageText, true);

        commandHandler.handleChatMessage(firebotChatMessage);

        frontendCommunicator.send("twitch:chat:message", firebotChatMessage);
    });

    streamerChatClient.onAction(async (_channel, _user, messageText, msg) => {
        const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, messageText, false, true);
        frontendCommunicator.send("twitch:chat:message", firebotChatMessage);

        twitchEventsHandler.chatMessage.triggerChatMessage(firebotChatMessage);

        twitchEventsHandler.viewerArrived.triggerViewerArrived(msg.userInfo.displayName);
    });

    streamerChatClient.onMessageRemove((_channel, messageId) => {
        frontendCommunicator.send("twitch:chat:message:deleted", messageId);
    });

    streamerChatClient.onHosted((_, byChannel, auto, viewers) => {
        twitchEventsHandler.host.triggerHost(byChannel, auto, viewers);
        const logger = require("../../logwrapper");
        logger.debug(`Host triggered by ${byChannel}. Is auto: ${auto}`);
    });

    streamerChatClient.onResub(async (_channel, _user, subInfo, msg) => {
        try {
            const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, subInfo.message);

            frontendCommunicator.send("twitch:chat:message", firebotChatMessage);

            exports.events.emit("chat-message", firebotChatMessage);
        } catch (error) {
            logger.error("Failed to parse resub message", error);
        }
    });

    streamerChatClient.onCommunitySub((_channel, _user, subInfo, msg) => {
        twitchEventsHandler.giftSub.triggerCommunitySubGift(subInfo.gifterDisplayName,
            subInfo.plan, subInfo.count);
    });

    streamerChatClient.onRaid((_channel, _username, raidInfo) => {
        twitchEventsHandler.raid.triggerRaid(raidInfo.displayName, raidInfo.viewerCount);
    });

    streamerChatClient.onBan((_, username) => {
        twitchEventsHandler.viewerBanned.triggerBanned(username);
        frontendCommunicator.send("twitch:chat:user:delete-messages", username);
    });

    streamerChatClient.onTimeout((_, username, duration) => {
        twitchEventsHandler.viewerTimeout.triggerTimeout(username, duration);
        frontendCommunicator.send("twitch:chat:user:delete-messages", username);
    });
};