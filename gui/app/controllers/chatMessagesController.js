'use strict';
(function() {

    const moment = require('moment');

    //This handles the Settings tab

    angular
        .module('firebotApp')
        .controller('chatMessagesController', function($scope, $timeout, $q, $sce, chatMessagesService, connectionService, listenerService) {

            $scope.chatMessage = '';
            $scope.chatSender = "Streamer";
            $scope.disabledMessage = "";

            $scope.currentViewers = 0;

            $scope.botLoggedIn = connectionService.accounts.bot.isLoggedIn;

            // Gets all chat messages from chat message service.
            $scope.getMessages = function() {
                return chatMessagesService.chatQueue;
            };

            // Gets all chat users we have from the message service.
            $scope.getChatUsers = function () {
                return chatMessagesService.getChatUsers();
            };

            // Takes a complete message packet and checks to see if it's a whisper.
            $scope.isWhisper = function(data) {
                if (data.message.meta.whisper === true) {
                    return true;
                }
                return false;
            };

            // Takes a complete message packet and checks to see if it's a /me.
            $scope.isAction = function(data) {
                if (data.message.meta.me === true) {
                    return true;
                }
                return false;
            };

            // Takes a compelete message packet and checks to see if it's deleted.
            $scope.isDeleted = function(data) {
                if (data.deleted != null) {
                    return true;
                }
                return false;
            };

            // Returns first role in set of roles which should be their primary.
            // Filters out subscriber, because we have a separate function for that and it doesnt have it's own chat color.
            $scope.getRole = function(data) {
                // Because mixer chat user packets and api user packets are different, we check for both formats of user_role.
                let roles = data.user_roles,
                    newRoles = [];

                newRoles = roles.filter(role => role !== "Subscriber");
                return newRoles[0];
            };

            // Returns true if user is a sub.
            $scope.isSubscriber = function(data) {
                let roles = data.user_roles,
                    newRoles = roles.find(role => role === "Subscriber");

                if (newRoles != null) {
                    return true;
                }

                return false;
            };

            // Returns sub icon url if there is one, else returns false.
            $scope.getSubIcon = function() {
                return chatMessagesService.getSubIcon();
            };

            // Returns the message id of the message.
            $scope.getMessageId = function(data) {
                return data.id;
            };

            // This gets the html from the message.
            $scope.getMessageContent = function(data) {
                return $sce.trustAsHtml(data.messageHTML);
            };

            $scope.getTimeStamp = function(message) {
                //Todo: create setting to allow user to switch to 24 hr time
                return moment(message.date).format('h:mm A');
            };

            // This tells us if the chat feed is on or not.
            $scope.getChatFeed = function() {
                return chatMessagesService.getChatFeed();
            };

            $scope.chatFeedIsEnabled = function() {
                // if chat feed is disabled in settings
                if (!chatMessagesService.getChatFeed()) {
                    $scope.disabledMessage = "The chat feed is currently disabled. Please go to Settings > Chat > Chat Feed to enable.";
                    return false;
                } else if (!connectionService.connectedToChat) {
                    $scope.disabledMessage = "The chat feed will enable once a connection to Chat has been made.";
                    return false;
                }
                return true;
            };

            // This happens when a chat message is submitted.
            $scope.submitChat = function() {
                chatMessagesService.submitChat($scope.chatSender, $scope.chatMessage);
                $scope.chatMessage = '';
            };

            listenerService.registerListener(
                { type: listenerService.ListenerType.CURRENT_VIEWERS_UPDATE },
                (data) => {
                    $scope.currentViewers = data.viewersCurrent;
                });

        });
}());
