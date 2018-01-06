'use strict';
(function() {

    //This handles the Settings tab

    angular
        .module('firebotApp')
        .controller('chatMessagesController', function($scope, $timeout, $q, $sce, chatMessagesService) {

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
                    apiRole = data.userRoles,
                    newRoles = [];
                if (roles != null) {
                    newRoles = roles.filter(role => role !== "Subscriber");
                } else {
                    newRoles = apiRole.filter(role => role !== "Subscriber");
                }

                return newRoles[0];
            };


            $scope.isSubscriber = function(data) {
                let roles = data.user_roles,
                    newRoles = roles.find(role => role === "Subscriber");

                if (newRoles.length > 0) {
                    return true;
                }

                return false;
            };

            // Returns the message id of the message.
            $scope.getMessageId = function(data) {
                return data.id;
            };

            // This gets the html from the message.
            $scope.getMessageContent = function(data) {
                return $sce.trustAsHtml(data.messageHTML);
            };

        });
}());
