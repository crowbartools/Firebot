"use strict";

const frontendCommunicator = require("../../common/frontend-communicator");
const chatCommandHandler = require("../commands/chat-command-handler");
const chatHelpers = require("../chat-helpers");
const { AccountAccess } = require("../../common/account-access");
const { ActiveUserHandler } = require("../active-user-handler");
const { ChatModerationManager } = require("../moderation/chat-moderation-manager");
const { TwitchEventHandlers } = require("../../streaming-platforms/twitch/events");
const twitchRolesManager = require("../../roles/twitch-roles-manager");
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

        TwitchEventHandlers.announcement.triggerAnnouncement(
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

        await ChatModerationManager.moderateMessage(firebotChatMessage);

        if (firebotChatMessage.isVip === true) {
            twitchRolesManager.addVipToVipList({
                id: msg.userInfo.userId,
                username: msg.userInfo.userName,
                displayName: msg.userInfo.displayName
            });
        } else {
            twitchRolesManager.removeVipFromVipList(msg.userInfo.userId);
        }

        // send to the frontend
        if (firebotChatMessage.isHighlighted) {
            firebotChatMessage.customRewardId = HIGHLIGHT_MESSAGE_REWARD_ID;
            firebotChatMessage.reward = {
                id: HIGHLIGHT_MESSAGE_REWARD_ID,
                name: "Highlight Message",
                cost: 0,
                imageUrl: "https://static-cdn.jtvnw.net/automatic-reward-images/highlight-4.png"
            };
        }
        frontendCommunicator.send("twitch:chat:message", firebotChatMessage);
        exports.events.emit("chat-message", firebotChatMessage);

        const { ranCommand, command, userCommand } = await chatCommandHandler.handleChatMessage(firebotChatMessage);

        await ActiveUserHandler.addActiveUser(msg.userInfo, true);

        TwitchEventHandlers.viewerArrived.triggerViewerArrived(
            msg.userInfo.userName,
            msg.userInfo.userId,
            msg.userInfo.displayName,
            messageText,
            firebotChatMessage
        );

        const { streamer, bot } = AccountAccess.getAccounts();
        if (user !== streamer.username && user !== bot.username) {
            const { TimerManager } = require("../../timers/timer-manager");
            TimerManager.incrementChatLineCounters();
        }

        TwitchEventHandlers.chatMessage.triggerChatMessage(
            firebotChatMessage,
            ranCommand,
            ranCommand ? command : null,
            ranCommand ? userCommand : null
        );
        if (firebotChatMessage.isFirstChat) {
            TwitchEventHandlers.chatMessage.triggerFirstTimeChat(firebotChatMessage);
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

        TwitchEventHandlers.whisper.triggerWhisper(
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
            twitchRolesManager.addVipToVipList({
                id: msg.userInfo.userId,
                username: msg.userInfo.userName,
                displayName: msg.userInfo.displayName
            });
        } else {
            twitchRolesManager.removeVipFromVipList(msg.userInfo.userId);
        }

        frontendCommunicator.send("twitch:chat:message", firebotChatMessage);

        const { ranCommand, command, userCommand } = await chatCommandHandler.handleChatMessage(firebotChatMessage);

        await ActiveUserHandler.addActiveUser(msg.userInfo, true);

        TwitchEventHandlers.chatMessage.triggerChatMessage(
            firebotChatMessage,
            ranCommand,
            ranCommand ? command : null,
            ranCommand ? userCommand : null
        );
        if (firebotChatMessage.isFirstChat) {
            TwitchEventHandlers.chatMessage.triggerFirstTimeChat(firebotChatMessage);
        }

        TwitchEventHandlers.viewerArrived.triggerViewerArrived(
            msg.userInfo.userName,
            msg.userInfo.userId,
            msg.userInfo.displayName,
            messageText,
            firebotChatMessage
        );
    });

    streamerChatClient.onResub(async (_channel, _user, subInfo, msg) => {
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
};