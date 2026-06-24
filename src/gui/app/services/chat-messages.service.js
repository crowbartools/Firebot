"use strict";

(function() {
    angular
        .module('firebotApp')
        .factory('chatMessagesService', function (settingsService,
            soundService, backendCommunicator) {
            const service = {};

            service.chatFeedItems = [];
            service.chatFeedItemLimit = 150;

            service.viewers = [];

            service.autodisconnected = false;

            // The active chat sender identifier, either "Streamer" or "Bot"
            service.chatSender = "Streamer";
            // The pending but unsent outgoing chat message text
            service.messageText = "";
            // The message/thread currently being replied to
            service.threadDetails = null;

            // History of chat messages sent via Dashboard
            service.chatHistory = [];
            service.currrentHistoryIndex = -1;

            // Return User List with people in role filtered out.
            service.getFilteredChatUserList = function() {
                return service.viewers.filter(user => !user.disableViewerList);
            };

            service.spotlightMessage = (username, userId, displayName, rawText, chatMessage) => {
                backendCommunicator.send("spotlight-message", {
                    username: username,
                    userId: userId,
                    displayName: displayName,
                    messageText: rawText,
                    chatMessage: chatMessage
                });
            };

            // This submits a chat message to Twitch.
            service.sendChatMessage = function(sender, message, replyToMessageId) {
                backendCommunicator.send("chat:send-chat-message", {
                    message: message,
                    accountType: sender,
                    replyToMessageId: replyToMessageId
                });
            };

            service.deleteMessage = async (messageId) => {
                backendCommunicator.send("chat:delete-message", messageId);
            };

            service.pinMessage = async (messageId) => {
                backendCommunicator.send("chat:pin-message", messageId);
            };

            backendCommunicator.on("twitch:chat:autodisconnected", (autodisconnected) => {
                service.autodisconnected = autodisconnected;
            });

            // Chat feed

            backendCommunicator.on("chat:new-chat-feed-item", (item) => {
                service.chatFeedItems.push(item);

                if (item.type === "message") {
                    if (item.data.tagged === true) {
                        soundService.playChatNotification();
                    }
                }

                if (service.chatFeedItems.length > service.chatFeedItemLimit) {
                    service.chatFeedItems.shift();
                }
            });

            const updateChatFeedItem = (item) => {
                const existingItemIndex = service.chatFeedItems.findIndex(i => i.id === item.id && i.type === item.type);

                if (existingItemIndex > -1) {
                    service.chatFeedItems.splice(existingItemIndex, 1, item);
                }
            };

            backendCommunicator.on("chat:chat-feed-item-updated",
                item => updateChatFeedItem(item)
            );

            backendCommunicator.on("chat:chat-feed-items-updated",
                items => items.forEach(updateChatFeedItem)
            );

            backendCommunicator.on("chat:all-chat-feed-items", (chatFeedItems) => {
                service.chatFeedItems = chatFeedItems;
            });

            // Viewers

            backendCommunicator.on("chat:viewer-joined", (viewer) => {
                service.viewers.push(viewer);
            });

            const updateViewer = (viewer) => {
                const existingViewerIndex = service.viewers.findIndex(v => v.id === viewer.id);

                if (existingViewerIndex > -1) {
                    service.viewers.splice(existingViewerIndex, 1, viewer);
                }
            };

            backendCommunicator.on("chat:viewer-updated",
                viewer => updateViewer(viewer)
            );

            backendCommunicator.on("chat:viewers-updated",
                viewers => viewers.forEach(updateViewer)
            );

            backendCommunicator.on("chat:viewer-left", (id) => {
                service.viewers = service.viewers.filter(v => v.id !== id);
            });

            backendCommunicator.on("chat:all-viewers", (viewers) => {
                service.viewers = viewers;
            });

            // Emotes

            service.allEmotes = {
                streamer: [],
                bot: [],
                thirdParty: []
            };

            service.filteredEmotes = {
                streamer: [],
                bot: [],
                thirdParty: []
            };

            service.refreshEmotes = () => {
                const showBttvEmotes = settingsService.getSetting("ChatShowBttvEmotes");
                const showFfzEmotes = settingsService.getSetting("ChatShowFfzEmotes");
                const showSevenTvEmotes = settingsService.getSetting("ChatShowSevenTvEmotes");

                service.filteredEmotes = {
                    streamer: service.allEmotes.streamer,
                    bot: service.allEmotes.bot,
                    thirdParty: service.allEmotes.thirdParty.filter((e) => {
                        if (showBttvEmotes !== true && e.origin === "BTTV") {
                            return false;
                        }

                        if (showFfzEmotes !== true && e.origin === "FFZ") {
                            return false;
                        }

                        if (showSevenTvEmotes !== true && e.origin === "7TV") {
                            return false;
                        }

                        return true;
                    })
                };
            };

            backendCommunicator.on("chat:all-emotes", (emotes) => {
                service.allEmotes = emotes;
                service.refreshEmotes();
            });

            // Send the all ready

            backendCommunicator.send("chat:ui-service-ready");

            return service;
        });
}());
