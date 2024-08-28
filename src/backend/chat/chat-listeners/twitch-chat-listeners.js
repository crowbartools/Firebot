"use strict";

const frontendCommunicator = require("../../common/frontend-communicator");
const chatCommandHandler = require("../commands/chat-command-handler");
const chatHelpers = require("../chat-helpers");
const activeUserHandler = require("./active-user-handler");
const accountAccess = require("../../common/account-access");
const chatModerationManager = require("../moderation/chat-moderation-manager");
const chatRolesManager = require("../../roles/chat-roles-manager");
const twitchEventsHandler = require("../../events/twitch-events");
const raidMessageChecker = require(".././moderation/raid-message-checker");
const viewerDatabase = require("../../viewers/viewer-database");
const logger = require("../../logwrapper");

const events = require("events");

exports.events = new events.EventEmitter();

/** @arg {import('@twurple/chat').ChatClient} botChatClient */
exports.setupBotChatListeners = (botChatClient) => {
    botChatClient.onWhisper(async (_user, messageText, msg) => {
        const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, messageText, true);
        chatCommandHandler.handleChatMessage(firebotChatMessage);
    });
};

const HIGHLIGHT_MESSAGE_REWARD_ID = "highlight-message";

/**
 * @arg {import('@twurple/chat').ChatClient} streamerChatClient
 * @arg {import('@twurple/chat').ChatClient} botChatClient
 */
exports.setupChatListeners = (streamerChatClient, botChatClient) => {

    streamerChatClient.onAnnouncement(async (_channel, _user, announcementInfo, msg) => {
        const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, msg.text);

        firebotChatMessage.isAnnouncement = true;
        firebotChatMessage.announcementColor = announcementInfo.color ?? "PRIMARY";

        frontendCommunicator.send("twitch:chat:message", firebotChatMessage);

        twitchEventsHandler.announcement.triggerAnnouncement(
            firebotChatMessage.username,
            firebotChatMessage.userId,
            firebotChatMessage.userDisplayName,
            firebotChatMessage.roles,
            firebotChatMessage.rawText,
            firebotChatMessage.id
        );
    });

    streamerChatClient.onMessage(async (_channel, user, messageText, msg) => {
        const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, messageText);

        await chatModerationManager.moderateMessage(firebotChatMessage);

        if (firebotChatMessage.isVip === true) {
            chatRolesManager.addVipToVipList({
                id: msg.userInfo.userId,
                username: msg.userInfo.userName,
                displayName: msg.userInfo.displayName
            });
        } else {
            chatRolesManager.removeVipFromVipList(msg.userInfo.userId);
        }

        // send to the frontend
        if (firebotChatMessage.isHighlighted) {
            firebotChatMessage.customRewardId = HIGHLIGHT_MESSAGE_REWARD_ID;
            frontendCommunicator.send("twitch:chat:rewardredemption", {
                id: HIGHLIGHT_MESSAGE_REWARD_ID,
                messageText: firebotChatMessage.rawText,
                user: {
                    id: firebotChatMessage.userId,
                    username: firebotChatMessage.username,
                    displayName: firebotChatMessage.userDisplayName
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

        chatCommandHandler.handleChatMessage(firebotChatMessage);

        await activeUserHandler.addActiveUser(msg.userInfo, true);

        twitchEventsHandler.viewerArrived.triggerViewerArrived(
            msg.userInfo.userName,
            msg.userInfo.userId,
            msg.userInfo.displayName,
            messageText,
            firebotChatMessage
        );

        const { streamer, bot } = accountAccess.getAccounts();
        if (user !== streamer.username && user !== bot.username) {
            const timerManager = require("../../timers/timer-manager");
            timerManager.incrementChatLineCounters();
        }

        twitchEventsHandler.chatMessage.triggerChatMessage(firebotChatMessage);
        if (firebotChatMessage.isFirstChat) {
            twitchEventsHandler.chatMessage.triggerFirstTimeChat(firebotChatMessage);
        }
        await raidMessageChecker.sendMessageToCache({
            rawText: firebotChatMessage.rawText,
            userId: firebotChatMessage.userId
        });
    });

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

    streamerChatClient.onAction(async (_channel, _user, messageText, msg) => {
        const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, messageText, false, true);

        if (firebotChatMessage.isVip === true) {
            chatRolesManager.addVipToVipList({
                id: msg.userInfo.userId,
                username: msg.userInfo.userName,
                displayName: msg.userInfo.displayName
            });
        } else {
            chatRolesManager.removeVipFromVipList(msg.userInfo.userId);
        }

        frontendCommunicator.send("twitch:chat:message", firebotChatMessage);

        chatCommandHandler.handleChatMessage(firebotChatMessage);

        await activeUserHandler.addActiveUser(msg.userInfo, true);

        twitchEventsHandler.chatMessage.triggerChatMessage(firebotChatMessage);
        if (firebotChatMessage.isFirstChat) {
            twitchEventsHandler.chatMessage.triggerFirstTimeChat(firebotChatMessage);
        }

        twitchEventsHandler.viewerArrived.triggerViewerArrived(
            msg.userInfo.userName,
            msg.userInfo.userId,
            msg.userInfo.displayName,
            messageText,
            firebotChatMessage
        );
    });

    streamerChatClient.onMessageRemove((_channel, messageId, message) => {
        twitchEventsHandler.chatMessage.triggerChatMessageDeleted(message);
        frontendCommunicator.send("twitch:chat:message:deleted", messageId);
    });

    streamerChatClient.onResub(async (_channel, _user, subInfo, msg) => {
        try {
            if (subInfo.originalGiftInfo != null) {
                twitchEventsHandler.sub.triggerSub(
                    msg.userInfo.userName,
                    subInfo.userId,
                    subInfo.displayName,
                    subInfo.plan,
                    subInfo.months || 1,
                    subInfo.message ?? "",
                    subInfo.streak || 1,
                    false,
                    true
                );
            }
        } catch (error) {
            logger.error("Failed to parse resub message (multi-month gifted sub)", error);
        }

        try {
            if (subInfo.message != null && subInfo.message.length > 0) {
                const firebotChatMessage = await chatHelpers.buildFirebotChatMessage(msg, subInfo.message);

                frontendCommunicator.send("twitch:chat:message", firebotChatMessage);

                exports.events.emit("chat-message", firebotChatMessage);
            }
        } catch (error) {
            logger.error("Failed to parse resub message", error);
        }
        viewerDatabase.calculateAutoRanks(subInfo.userId);
    });

    streamerChatClient.onCommunitySub((_channel, _user, subInfo) => {
        twitchEventsHandler.giftSub.triggerCommunitySubGift(
            subInfo.gifterDisplayName ?? "An Anonymous Gifter",
            subInfo.plan,
            subInfo.count
        );
    });

    streamerChatClient.onSubGift((_channel, _user, subInfo) => {
        twitchEventsHandler.giftSub.triggerSubGift(
            subInfo.gifterDisplayName ?? "An Anonymous Gifter",
            subInfo.gifter,
            subInfo.gifterUserId,
            !subInfo.gifterUserId,
            subInfo.displayName,
            subInfo.plan,
            subInfo.giftDuration,
            subInfo.months,
            subInfo.streak ?? 1
        );
        viewerDatabase.calculateAutoRanks(subInfo.userId);
    });

    streamerChatClient.onGiftPaidUpgrade((_channel, _user, subInfo, msg) => {
        twitchEventsHandler.giftSub.triggerSubGiftUpgrade(
            msg.userInfo.userName,
            subInfo.userId,
            subInfo.displayName,
            subInfo.gifterDisplayName,
            subInfo.plan
        );
        viewerDatabase.calculateAutoRanks(subInfo.userId);
    });

    streamerChatClient.onPrimePaidUpgrade((_channel, _user, subInfo, msg) => {
        twitchEventsHandler.sub.triggerPrimeUpgrade(
            msg.userInfo.userName,
            subInfo.userId,
            subInfo.displayName,
            subInfo.plan
        );
        viewerDatabase.calculateAutoRanks(subInfo.userId);
    });
};