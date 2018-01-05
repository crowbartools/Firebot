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
            $scope.getRole = function(data) {
                return data.user_roles[0];
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
