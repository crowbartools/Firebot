"use strict";
(function() {
    const moment = require('moment');

    const uuid = require("uuid/v4");

    angular
        .module('firebotApp')
        .factory('chatMessagesService', function ($rootScope, logger, listenerService, settingsService,
            soundService, backendCommunicator, $q, pronounsService) {
            let service = {};

            // Chat Message Queue
            service.chatQueue = [];

            // the number of messages to show at any given time. This helps performance
            service.chatMessageDisplayLimit = 75;

            // Chat User List
            service.chatUsers = [];

            // Tells us if we should process in app chat or not.
            service.getChatFeed = function() {
                return settingsService.getRealChatFeed();
            };

            // Return the chat queue.
            service.getChatQueue = function() {
                return service.chatQueue;
            };

            // Clear Chat Queue
            service.clearChatQueue = function() {
                service.chatQueue = [];
            };

            // Return User List
            service.getChatUsers = function() {
                // Sort list so we are in alphabetical order
                let userList = service.chatUsers;
                if (userList.length > 0) {
                    userList.sort(function(a, b) {
                        return a.username.localeCompare(b.username);
                    });
                }
                return userList;
            };

            // Clear User List
            service.clearUserList = function() {
                service.chatUsers = [];
            };

            // Full Chat User Refresh
            // This replaces chat users with a fresh list pulled from the backend in the chat processor file.
            service.chatUserRefresh = function(data) {
                let users = data.chatUsers.map(u => {
                    u.id = u.userId;
                    return u;
                });
                service.chatUsers = users;
            };

            // User joined the channel.
            service.chatUserJoined = function (data) {
                if (!service.chatUsers.some(u => u.id === data.id)) {
                    service.chatUsers.push(data);
                }
            };

            // User left the channel.
            service.chatUserLeft = function(data) {
                let userId = data.id,
                    arr = service.chatUsers,
                    userList = arr.filter(x => x.id !== userId);

                service.chatUsers = userList;
            };

            // Purge Chat Message
            service.purgeChatMessages = function(data) {
                let chatQueue = service.chatQueue;

                let cachedUserName = null;
                chatQueue.forEach(message => {
                    // If user id matches, then mark the message as deleted.
                    if (message.user_id === data.user_id) {
                        if (cachedUserName == null) {
                            cachedUserName = message.user_name;
                        }
                        message.deleted = true;

                        let modName = "a mod";
                        if (data.moderator) {
                            modName = data.moderator.user_name;
                        }
                        message.eventInfo = `Purged by ${modName}.`;

                    }
                });

                if (data.cause && cachedUserName) {
                    if (data.cause.type === "timeout") {
                        service.chatAlertMessage(`${cachedUserName} was timed out by ${data.moderator.user_name} for ${data.cause.durationString}.`);
                    } else if (data.cause.type === "ban") {
                        service.chatAlertMessage(`${cachedUserName} was banned by ${data.moderator.user_name}.`);
                    }
                }
            };

            service.highlightMessage = (username, rawText) => {
                backendCommunicator.fireEvent("highlight-message", {
                    username: username,
                    messageText: rawText
                });
            };

            // Chat Alert Message
            service.chatAlertMessage = function(message) {

                const alertItem = {
                    id: uuid(),
                    type: "alert",
                    data: message
                };

                service.chatQueue.push(alertItem);
            };

            backendCommunicator.on("chat-feed-system-message", (message) => {
                service.chatAlertMessage(message);
            });

            // User Update
            // This is sent when a user's roles are updated. For example, when someone is banned.
            // Currently, this only checks for bans. It does not automatically unban the user after.
            // Reason is, people can be added to our banned user group without being banned from the channel.
            // But we're assuming here that if they're banned from the channel we should ban them from interactive always.
            service.userUpdate = function(data) {
            };

            // Chat Update Handler
            // This handles all of the chat stuff that isn't a message.
            // This will only work when chat feed is turned on in the settings area.
            service.chatUpdateHandler = function(data) {
                switch (data.fbEvent) {
                case "ClearMessages":
                    logger.info("Chat cleared");
                    service.clearChatQueue();

                    service.chatAlertMessage('Chat has been cleared by ' + data.clearer.user_name + '.');
                    break;
                case "PurgeMessage":
                    logger.info("Chat message purged");
                    service.purgeChatMessages(data);
                    break;
                case "UserJoin":
                    logger.debug("Chat User Joined");

                    // Standardize user roles naming.
                    data.user_roles = data.roles; // eslint-disable-line

                    service.chatUserJoined(data);
                    break;
                case "UserLeave":
                    logger.debug("Chat User Left");

                    // Standardize user roles naming.
                    data.user_roles = data.roles; // eslint-disable-line

                    service.chatUserLeft(data);
                    break;
                case "UserUpdate":
                    logger.debug("User updated");
                    service.userUpdate(data);
                    break;
                case "Disconnected":
                    // We disconnected. Clear messages, post alert, and then let the reconnect handle repopulation.
                    logger.info("Chat Disconnected!");
                    service.clearChatQueue();
                    service.chatAlertMessage("Chat has been disconnected.");
                    break;
                case "UsersRefresh":
                    logger.info("Chat userlist refreshed.");
                    service.chatUserRefresh(data);
                    break;
                case "ChatAlert":
                    logger.debug("Chat alert from backend.");
                    service.chatAlertMessage(data.message);
                    break;
                default:
                    // Nothing
                    logger.warn("Unknown chat event sent", data);
                }
            };

            // Prune Messages
            service.pruneChatQueue = function() {
                const arr = service.chatQueue,
                    overflowChat = arr.length - service.chatMessageDisplayLimit * 2;

                // Overflow chat is how many messages we need to remove to bring it back down
                // to service.chatMessageDisplayLimit x 2.
                if (overflowChat > 0) {

                    // Recalculate to overflow over the set display limit so we aren't pruning after every
                    // message once we hit chatMessageDisplayLimit x 2.
                    const bufferOverflowAmount = arr.length - service.chatMessageDisplayLimit;

                    // Start at 0 in the array and delete X number of messages.
                    // The oldest messages are the first ones in the array.
                    arr.splice(0, bufferOverflowAmount);
                }
            };

            service.getSubIcon = function() {
                return "";
            };

            service.levels = {};


            // This submits a chat message to mixer.
            service.submitChat = function(sender, message) {
                backendCommunicator.send("send-chat-message", {
                    message: message,
                    accountType: sender
                });
            };

            // Gets view count setting for ui.
            service.getChatViewCountSetting = function() {
                let viewCount = settingsService.getChatViewCount();
                if (viewCount === "On") {
                    return true;
                }
                return false;
            };

            // Gets view count setting for ui.
            service.getChatViewerListSetting = function() {
                return settingsService.getShowChatViewerList();
            };

            function markMessageAsDeleted(messageId) {
                const messageItem = service.chatQueue.find(i => i.type === "message" && i.data.id === messageId);

                if (messageItem != null) {
                    messageItem.data.deleted = true;
                }
            }

            service.deleteMessage = messageId => {
                markMessageAsDeleted(messageId);
                backendCommunicator.send("delete-message", messageId);
            };

            backendCommunicator.on("twitch:chat:message:deleted", markMessageAsDeleted);

            function markUserMessagesAsDeleted(username) {
                service.chatQueue
                    .filter(i => i.type === "message" && i.data.username.toLowerCase() === username)
                    .map(i => i.data.id)
                    .forEach(markMessageAsDeleted);
            }

            backendCommunicator.on("twitch:chat:user:delete-messages", markUserMessagesAsDeleted);

            service.changeModStatus = (username, shouldBeMod) => {
                backendCommunicator.send("update-user-mod-status", {
                    username,
                    shouldBeMod
                });
            };

            // $interval(() => {
            //     if (messageHoldingQueue.length > 0) {
            //         service.chatQueue = service.chatQueue.concat(messageHoldingQueue);
            //         messageHoldingQueue = [];

            //         // Trim messages.
            //         service.pruneChatQueue();

            //         //hacky way to ensure we stay scroll glued
            //         $timeout(() => {
            //             $rootScope.$broadcast('ngScrollGlue.scroll');
            //         }, 1);
            //     }
            // }, 250);

            backendCommunicator.on("twitch:chat:rewardredemption", redemption => {
                if (settingsService.getRealChatFeed()) {

                    const redemptionItem = {
                        id: uuid(),
                        type: "redemption",
                        data: redemption
                    };

                    if (service.chatQueue && service.chatQueue.length > 0) {
                        const lastQueueItem = service.chatQueue[service.chatQueue.length - 1];
                        if (!lastQueueItem.rewardMatched &&
                            lastQueueItem.type === "message" &&
                            lastQueueItem.data.customRewardId != null &&
                            lastQueueItem.data.customRewardId === redemption.reward.id &&
                            lastQueueItem.data.userId === redemption.user.id) {
                            lastQueueItem.rewardMatched = true;
                            service.chatQueue.splice(-1, 0, redemptionItem);
                            return;
                        }
                    }

                    service.chatQueue.push(redemptionItem);
                }
            });

            backendCommunicator.on("twitch:chat:user-joined", user => {
                service.chatUserJoined(user);
            });

            backendCommunicator.on("twitch:chat:user-left", id => {
                service.chatUserLeft(({ id }));
            });

            backendCommunicator.on("twitch:chat:clear-user-list", () => {
                service.clearUserList();
            });

            backendCommunicator.on("twitch:chat:user-active", id => {
                const user = service.chatUsers.find(u => u.id === id);
                if (user != null) {
                    user.active = true;
                }
            });

            backendCommunicator.on("twitch:chat:user-inactive", id => {
                const user = service.chatUsers.find(u => u.id === id);
                if (user != null) {
                    user.active = false;
                }
            });

            backendCommunicator.on("twitch:chat:message", chatMessage => {
                if (chatMessage.tagged) {
                    soundService.playChatNotification();
                }

                pronounsService.getUserPronoun(chatMessage.username);

                const now = moment();
                chatMessage.timestamp = now;
                chatMessage.timestampDisplay = now.format('h:mm A');

                if (chatMessage.profilePicUrl == null) {
                    chatMessage.profilePicUrl = "../images/placeholders/default-profile-pic.png";
                }

                if (settingsService.getRealChatFeed()) {
                    // Push new message to queue.
                    const messageItem = {
                        id: uuid(),
                        type: "message",
                        data: chatMessage
                    };

                    if (chatMessage.customRewardId != null &&
                        service.chatQueue &&
                        service.chatQueue.length > 0) {
                        const lastQueueItem = service.chatQueue[service.chatQueue.length - 1];
                        if (lastQueueItem.type === "redemption" &&
                            lastQueueItem.data.reward.id === chatMessage.customRewardId &&
                            lastQueueItem.data.user.id === chatMessage.userId) {
                            messageItem.rewardMatched = true;
                        }
                    }

                    service.chatQueue.push(messageItem);

                    service.pruneChatQueue();
                }
            });

            service.allEmotes = [];
            backendCommunicator.on("all-emotes", (emotes) => {
                service.allEmotes = emotes;
            });

            // Watches for an chat update from main process
            // This handles clears, deletions, timeouts, etc... Anything that isn't a message.
            listenerService.registerListener(
                { type: listenerService.ListenerType.CHAT_UPDATE },
                data => {
                    if (settingsService.getRealChatFeed() === true) {
                        service.chatUpdateHandler(data);
                    }
                }
            );

            // Connection Monitor
            // Receives event from main process that connection has been established or disconnected.
            listenerService.registerListener(
                { type: listenerService.ListenerType.CHAT_CONNECTION_STATUS },
                isChatConnected => {
                    if (isChatConnected) {
                        service.chatQueue = [];
                    }
                }
            );

            return service;
        });
}());
