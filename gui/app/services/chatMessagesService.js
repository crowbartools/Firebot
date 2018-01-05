'use strict';
(function() {

    //This manages the chat window.

    angular
        .module('firebotApp')
        .factory('chatMessagesService', function (listenerService) {
            let service = {};

            // Chat Message Queue
            service.chatQueue = [];

            // Return the chat queue.
            service.getChatQueue = function() {
                return service.chatQueue;
            };

            // Clear Chat Queue
            service.clearChatQueue = function() {
                service.chatQueue = [];
            };

            // Delete Chat Message
            service.deleteChatMessage = function(data) {
                let arr = service.chatQueue,
                    message = arr.find(message => message.id === data.id);
                console.log(message);
                message.deleted = true;
                message.eventInfo = "Deleted by " + data.moderator.user_name + '.';
                console.log(arr);
            };

            // Chat Alert Message
            service.chatAlertMessage = function(message) {
                let data = {
                    id: "System",
                    user_name: "System", // eslint-disable-line
                    user_roles: [ // eslint-disable-line
                        "System"
                    ],
                    user_avatar: "../images/logo.jpg", // eslint-disable-line
                    messageHTML: message
                };
                service.chatQueue.push(data);
            };

            // Chat Update Handler
            // This handles all of the chat stuff that isn't a message.
            service.chatUpdateHandler = function(data) {
                switch (data.fbEvent) {
                case "ClearMessage":
                    console.log('Chat cleared');
                    console.log(data);
                    service.clearChatQueue();
                    service.chatAlertMessage('Chat has been cleared by ' + data.clearer.user_name + '.');
                    break;
                case "DeleteMessage":
                    console.log('Chat message deleted');
                    console.log(data);
                    service.deleteChatMessage(data);
                    break;
                case "PurgeMessage":
                    console.log('Chat message purged');
                    console.log(data);
                    break;
                case "UserTimeout":
                    console.log('Chat user timed out');
                    console.log(data);
                    break;
                case "PollStart":
                case "PollEnd":
                    console.log('Chat poll update');
                    console.log(data);
                    break;
                case "UserJoin":
                    console.log('Chat User Joined');
                    console.log(data);
                    break;
                case "UserLeave":
                    console.log('Chat User Left');
                    console.log(data);
                    break;
                case "UserUpdate":
                    console.log('User updated');
                    console.log(data);
                    break;
                case "Disconnected":
                    // We disconnected. Clear messages, post alert, and then let the reconnect handle repopulation.
                    console.log('Chat Disconnected!');
                    console.log(data);
                    service.clearChatQueue();
                    service.chatAlertMessage('Chat has been disconnected.');
                    break;
                default:
                    // Nothing
                    console.log('Unknown chat event sent');
                    console.log(data);
                }
            };

            // Prune Messages
            // This checks the chat queue and purges anything over 200 messages.
            service.chatPrune = function() {
                let arr = service.chatQueue;
                if (arr.length > 200) {
                    arr.splice(0, 1);
                }
            };

            // Watches for an chat message from main process
            // Pushes it to chat queue when it is recieved.
            listenerService.registerListener(
                { type: listenerService.ListenerType.CHAT_MESSAGE },
                (data) => {
                    // Push new message to queue.
                    service.chatQueue.push(data);

                    // Trim messages over 200.
                    service.chatPrune();
                });

            // Watches for an chat update from main process
            // This handles clears, deletions, timeouts, etc... Anything that isn't a message.
            listenerService.registerListener(
                { type: listenerService.ListenerType.CHAT_UPDATE },
                (data) => {
                    service.chatUpdateHandler(data);
                });

            return service;
        });
}());
