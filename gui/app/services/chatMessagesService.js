'use strict';
(function() {

    //This manages command data

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

            // Watches for an chat message from main process
            // Pushes it to chat queue when it is recieved.
            listenerService.registerListener(
                { type: listenerService.ListenerType.CHAT_MESSAGE },
                (data) => {
                    service.chatQueue.push(data);
                });

            return service;
        });
}());
