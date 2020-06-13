"use strict";
(function() {
    //This manages the chat window.
    const profileManager = require("../../backend/common/profile-manager.js");

    const moment = require('moment');

    const uuid = require("uuid/v4");

    angular
        .module('firebotApp')
        .factory('chatMessagesService', function ($rootScope, logger, listenerService, settingsService,
            soundService, connectionService, $timeout, $interval, $http, backendCommunicator) {
            let service = {};

            // Chat Message Queue
            service.chatQueue = [];

            // the number of messages to show at any given time. This helps performance
            service.chatMessageDisplayLimit = 75;

            // Chat User List
            service.chatUsers = [];

            //this contains executionId and gif url correllations for the mixer gif effect
            let gifSkillDictionary = {};

            // Sub Icon Cache
            service.subIconCache = false;

            // Poll Cache
            // This stores poll durations.
            service.pollCache = false;

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

            // Delete Chat Message
            service.deleteChatMessage = function(data) {
                let arr = service.chatQueue,
                    message = arr.find(message => message.id === data.id);

                if (message) {
                    message.deleted = true;
                    message.eventInfo = "Deleted by " + data.moderator.user_name + '.';
                }

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

            // Chat Alert Message
            service.chatAlertMessage = function(message) {
                let data = {
                    id: "System" + uuid(),
                    user_name: "Alert", // eslint-disable-line
                    user_id: "firebot-system-message", // eslint-disable-line
                    user_roles: [ // eslint-disable-line
                        "System"
                    ],
                    user_avatar: "../images/logo.png", // eslint-disable-line
                    message: {
                        message: [
                            {
                                type: "text",
                                data: message,
                                firebotSubsegments: [
                                    {
                                        type: "rawText",
                                        text: message
                                    }
                                ]
                            }
                        ],
                        meta: {
                            me: true
                        }
                    },
                    messageHTML: message,
                    date: new Date(),
                    whisper: false,
                    action: true,
                    mainColorRole: "System",
                    subscriber: false,
                    timestamp: moment(new Date()).format('h:mm A')
                };
                service.chatQueue.push(data);
            };

            backendCommunicator.on("chat-feed-system-message", (message) => {
                service.chatAlertMessage(message);
            });

            // Poll Update
            // This is fired when a poll starts or is updated.
            // Mixer fires this every second or so, but we only display chat alerts every 30 seconds.
            service.pollUpdate = function(data) {
                // If we aren't running a poll, display data right away. Otherwise display update every 30 seconds.
                if (
                    service.pollCache === false ||
          service.pollCache >= data.duration + 30000
                ) {
                    let votes = data.responses,
                        stringHolder = [],
                        answers = [];

                    // Parse vote data so we can form a string out of it.
                    Object.keys(votes).forEach(key => {
                        stringHolder.push(key + " (" + votes[key] + " votes)");
                    });

                    // If more than one answer, join it together into a string.
                    if (stringHolder.length > 1) {
                        answers = stringHolder.join(", ");
                    } else {
                        answers = stringHolder[0];
                    }

                    service.chatAlertMessage(
                        data.author.user_name +
              " is running a poll. Question: " +
              data.q +
              ". Answers: " +
              answers +
              "."
                    );

                    // Update Poll Cache
                    service.pollCache = data.duration;
                }
            };

            // Poll End
            // This will find the winner(s) and output an alert to chat.
            service.pollEnd = function(data) {
                let answers = data.responses,
                    winners = [],
                    winnerVotes = 0;
                Object.keys(answers).forEach(key => {
                    let answerVotes = answers[key];
                    if (answerVotes === winnerVotes) {
                        // We have a tie, push to the winner array.
                        winners.push(key);
                        winnerVotes = answerVotes;
                    } else if (answerVotes > winnerVotes) {
                        // This one has more votes. Clear winner array so far and push this one in there.
                        winners = [];
                        winners.push(key);
                        winnerVotes = answerVotes;
                    }
                });
                winners = winners.join(", ");
                service.chatAlertMessage(
                    data.author.user_name +
            "'s poll has ended. Question: " +
            data.q +
            ". Winner(s): " +
            winners +
            "."
                );

                // Clear poll cache.
                service.pollCache = false;
            };

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

                    gifSkillDictionary = {};

                    service.chatAlertMessage('Chat has been cleared by ' + data.clearer.user_name + '.');
                    break;
                case "DeleteMessage":
                    logger.info("Chat message deleted");
                    service.deleteChatMessage(data);
                    break;
                case "PurgeMessage":
                    logger.info("Chat message purged");
                    service.purgeChatMessages(data);
                    break;
                case "PollStart":
                    service.pollUpdate(data);
                    break;
                case "PollEnd":
                    service.pollEnd(data);
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
            // If message count is over 200, prune down
            service.pruneChatQueue = function() {
                let arr = service.chatQueue,
                    overflowChat = arr.length - service.chatMessageDisplayLimit * 2;

                // Overflow chat is how many messages we need to remove to bring it back down
                // to service.chatMessageDisplayLimit x 2.
                if (overflowChat > 0) {

                    // Recalculate to overflow over the set display limit so we arent pruning after every
                    // message once we hit chatMessageDisplayLimit x 2.
                    let bufferOverflowAmmount = arr.length - service.chatMessageDisplayLimit;

                    // Start at 0 in the array and delete X number of messages.
                    // The oldest messages are the first ones in the array.
                    arr.splice(0, bufferOverflowAmmount);
                }
            };

            service.getSubIcon = function() {
                if (service.subIconCache !== false) {
                    // Check to see if we've cached the icon yet. If we have, use it.
                    return service.subIconCache;
                }

                // We haven't cached the icon yet, lets do that.
                let dbAuth = profileManager.getJsonDbInProfile("/auth"),
                    streamer = dbAuth.getData("/streamer"),
                    subIcon = [];

                try {
                    // If this runs it means we have saved it to the auth file.
                    subIcon = dbAuth.getData("/streamer/subBadge");
                    service.subIconCache = subIcon;
                    return service.subIconCache;
                } catch (err) {
                    // If this runs it means we've never saved the sub badge.
                    request({
                        url: 'https://mixer.com/api/v1/channels/' + streamer.username + '?fields=badge,partnered',
                        headers: {
                            'Client-ID': 'f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9'
                        }
                    }, function (err, res) {
                        let data = JSON.parse(res.body);

                        // Push all to db.
                        if (data.partnered === true) {
                            dbAuth.push('./streamer/subBadge', data.badge.url);
                            service.subIconCache = data.badge.url;
                        }

                        return service.subIconCache;
                    }
                    );
                }
            };

            service.levels = {};
            $http.get("https://mixer.com/api/v1/ascension/levels")
                .then(response => {
                    if (response.status === 200 && response.data && response.data.levels) {
                        for (let level of response.data.levels) {
                            service.levels[`${level.level}`] = level;
                        }
                    }
                }, () => {});


            // This submits a chat message to mixer.
            service.submitChat = function(sender, message) {
                let chatPacket = {
                    message: message,
                    chatter: sender
                };
                ipcRenderer.send("uiChatMessage", chatPacket);
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
                let viewerList = settingsService.getChatViewerList();
                if (viewerList === "On") {
                    return true;
                }
                return false;
            };

            service.deleteMessage = messageId => {
                backendCommunicator.send("delete-message", messageId);
            };

            service.changeModStatus = (username, shouldBeMod) => {
                backendCommunicator.send("update-user-mod-status", {
                    username,
                    shouldBeMod
                });
            };


            let messageHoldingQueue = [];

            $interval(() => {
                if (messageHoldingQueue.length > 0) {
                    service.chatQueue = service.chatQueue.concat(messageHoldingQueue);
                    messageHoldingQueue = [];

                    // Trim messages.
                    service.pruneChatQueue();

                    //hacky way to ensure we stay scroll glued
                    $timeout(() => {
                        $rootScope.$broadcast('ngScrollGlue.scroll');
                    }, 1);
                }
            }, 250);


            function parseChatEventObject(data) {

                if (data.user_avatar == null) {
                    data.user_avatar = "https://mixer.com/_latest/assets/images/main/avatars/default.png"; // eslint-disable-line
                }

                if (data.message) {
                    let streamerName = connectionService.accounts.streamer.username,
                        botName = connectionService.accounts.bot.username;

                    let isTagged =
                        data.message.message.some(s => s.type === "tag" &&
                            (s.username.toLowerCase() === streamerName.toLowerCase() ||
                            s.username.toLowerCase() === botName.toLowerCase()));

                    if (isTagged) {
                        data.tagged = true;
                        if (!data.historical) {
                            soundService.playChatNotification();
                        }
                    }

                    data.whisper = data.message.meta.whisper === true;

                    data.action = data.message.meta.me === true;
                } else if (data.skill) {
                    data.isSkill = true;

                    // Set the icon for the currency used.
                    if (data.skill.currency === "Sparks") {
                        data.currencyIcon = "fas fa-bolt";
                    } else {
                        data.currencyIcon = "fas fa-fire";
                    }
                }


                // Returns first role in set of roles which should be their primary.
                // Filters out subscriber, because we have a separate function for that and
                // it doesnt have it's own chat color.
                data.mainColorRole = data.user_roles.find(r => r !== "Subscriber");

                data.subscriber = data.user_roles.some(r => r === "Subscriber");

                data.timestamp = moment(data.date).format('h:mm A');

                return data;
            }

            service.skillHasGifUrl = function(executionId) {
                return gifSkillDictionary[executionId] != null;
            };

            service.getGifUrlForSkill = function(executionId) {
                return gifSkillDictionary[executionId];
            };

            // Watches for a non chat (aka not sticker) skill event
            // it looks like a regular chat event object except instead of a
            // .message property, it has a .skill one.
            listenerService.registerListener(
                { type: listenerService.ListenerType.GIF_FOR_SKILL },
                (data) => {
                    if (settingsService.getRealChatFeed()) {
                        gifSkillDictionary[data.executionId] = data.gifUrl;
                    }
                });

            // Watches for a non chat (aka not sticker) skill event
            // it looks like a regular chat event object except instead of a
            // .message property, it has a .skill one.
            listenerService.registerListener(
                { type: listenerService.ListenerType.NON_CHAT_SKILL },
                (data) => {
                    if (settingsService.getRealChatFeed()) {
                        let queueEntry = parseChatEventObject(data);

                        // Push new message to queue.
                        messageHoldingQueue.push(queueEntry);
                    }
                });


            // Watches for an chat message from main process
            // Pushes it to chat queue when it is recieved.
            listenerService.registerListener(
                { type: listenerService.ListenerType.CHAT_MESSAGE },
                (data) => {

                    if (settingsService.getRealChatFeed() === true) {

                        let queueEntry = parseChatEventObject(data);

                        let existingIndex = service.chatQueue.findIndex(m => m.id === queueEntry.id);
                        if (existingIndex > -1) {
                            // this message already exists, update it (likely a catbot message being restored)
                            service.chatQueue[existingIndex] = queueEntry;
                        } else {
                            // Push new message to queue.
                            messageHoldingQueue.push(queueEntry);
                        }
                    }
                }
            );

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
            // Recieves event from main process that connection has been established or disconnected.
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
