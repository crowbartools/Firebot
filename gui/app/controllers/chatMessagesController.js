'use strict';
(function() {

    // const moment = require('moment'); // Not in use anymore. Leaving it like this just incase we revert.

    //This handles the Settings tab

    angular
        .module('firebotApp')
        .controller('chatMessagesController', function(logger, $rootScope, $scope, chatMessagesService, connectionService,
            listenerService, settingsService, soundService) {

            $scope.settings = settingsService;

            $scope.compactDisplay = settingsService.isChatCompactMode();
            $scope.alternateBackgrounds = settingsService.chatAlternateBackgrounds();
            $scope.hideDeletedMessages = settingsService.chatHideDeletedMessages();

            $scope.chatMessage = '';
            $scope.chatSender = "Streamer";
            $scope.disabledMessage = "";

            $scope.selectedUserData = {};

            $scope.currentViewers = 0;

            $scope.botLoggedIn = connectionService.accounts.bot.isLoggedIn;

            // the number of messages to show visually, we have to make the number negative so angular knows to limit
            // from the end of the array instead of the front
            $scope.messageDisplayLimit = chatMessagesService.chatMessageDisplayLimit * -1;

            $scope.toggleCompactMode = function() {
                $scope.compactDisplay = !$scope.compactDisplay;
                settingsService.setChatCompactMode($scope.compactDisplay);
            };

            $scope.toggleAlternateBackgrounds = function() {
                $scope.alternateBackgrounds = !$scope.alternateBackgrounds;
                settingsService.setChatAlternateBackgrounds($scope.alternateBackgrounds);
            };

            $scope.toggleHideDeletedMessages = function() {
                $scope.hideDeletedMessages = !$scope.hideDeletedMessages;
                settingsService.setChatHideDeletedMessages($scope.hideDeletedMessages);
            };

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
                return data.whisper;
            };

            // Takes a complete message packet and checks to see if it's a /me.
            $scope.isAction = function(data) {
                return data.action;
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
                return data.mainColorRole;
            };

            // Returns first role in set of roles which should be their primary.
            // Filters out subscriber, because we have a separate function for that and it doesnt have it's own chat color.
            $scope.getUserRole = function(user) {
                // Because mixer chat user packets and api user packets are different, we check for both formats of user_role.
                return user.user_roles.find(r => r !== "Subscriber");
            };

            // Returns true if user is a sub.
            $scope.isSubscriber = function(data) {
                return data.subscriber;
            };

            // Returns sub icon url if there is one, else returns false.
            $scope.getSubIcon = function() {
                return chatMessagesService.getSubIcon();
            };

            // Returns the message id of the message.
            $scope.getMessageId = function(data) {
                return data.id;
            };

            $scope.getWhisperData = function(data) {
                let target = data.target;
                return 'Whispered to ' + target + '.';
            };

            $scope.getTimeStamp = function(message) {
                //Todo: create setting to allow user to switch to 24 hr time
                return message.timestamp;
            };

            // This tells us if the chat feed is on or not.
            $scope.getChatFeed = function() {
                return chatMessagesService.getChatFeed();
            };

            $scope.chatFeedIsEnabled = function() {
                // if chat feed is disabled in settings
                if (!chatMessagesService.getChatFeed()) {
                    $scope.disabledMessage = "The chat feed is currently disabled. Click the gear in the bottom right corner to enable.";
                    return false;
                } else if (!connectionService.connectedToChat) {
                    $scope.disabledMessage = "The chat feed will enable once a connection to Chat has been made.";
                    return false;
                }
                return true;
            };

            $scope.getChatViewCountSetting = function() {
                return chatMessagesService.getChatViewCountSetting();
            };

            $scope.getChatViewerListSetting = function() {
                return chatMessagesService.getChatViewerListSetting();
            };

            function focusMessageInput() {
                angular.element('#chatMessageInput').trigger('focus');
            }

            $scope.messageActionSelected = (action, userName, msgId) => {
                switch (action.toLowerCase()) {
                case "delete":
                    chatMessagesService.deleteMessage(msgId);
                    break;
                case "timeout":
                    $scope.chatMessage = "/timeout @" + userName + " 5m";
                    focusMessageInput();
                    break;
                case "ban":
                    $scope.chatMessage = "/ban @" + userName;
                    focusMessageInput();
                    break;
                case "mod":
                    chatMessagesService.changeModStatus(userName, true);
                    break;
                case "unmod":
                    chatMessagesService.changeModStatus(userName, false);
                    break;
                case "whisper":
                    $scope.chatMessage = "/w @" + userName + " ";
                    focusMessageInput();
                    break;
                default:
                    return;
                }
            };

            // This happens when a chat message is submitted.
            let chatHistory = [];
            let currrentHistoryIndex = -1;
            $scope.submitChat = function() {
                chatMessagesService.submitChat($scope.chatSender, $scope.chatMessage);
                chatHistory.unshift($scope.chatMessage);
                currrentHistoryIndex = -1;
                $scope.chatMessage = '';
            };

            $scope.onMessageFieldUpdate = () => {
                currrentHistoryIndex = -1;
            };

            $scope.onMessageFieldKeypress = $event => {
                let keyCode = $event.which || $event.keyCode;
                if (keyCode === 38) { //up arrow
                    if ($scope.chatMessage.length < 1 || $scope.chatMessage === chatHistory[currrentHistoryIndex]) {
                        if (currrentHistoryIndex + 1 < chatHistory.length) {
                            currrentHistoryIndex++;
                            $scope.chatMessage = chatHistory[currrentHistoryIndex];
                        }
                    }
                } else if (keyCode === 40) { //down arrow
                    if ($scope.chatMessage.length > 0 || $scope.chatMessage === chatHistory[currrentHistoryIndex]) {
                        if (currrentHistoryIndex - 1 >= 0) {
                            currrentHistoryIndex--;
                            $scope.chatMessage = chatHistory[currrentHistoryIndex];
                        }
                    }
                } else if (keyCode === 13) { // enter
                    $scope.submitChat();
                }
            };

            $scope.playNotification = function() {
                soundService.playChatNotification();
            };

            $scope.selectedNotificationSound = settingsService.getTaggedNotificationSound();

            $scope.notificationVolume = settingsService.getTaggedNotificationVolume();

            $scope.volumeUpdated = function() {
                logger.debug('updating noti volume: ' + $scope.notificationVolume);
                settingsService.setTaggedNotificationVolume($scope.notificationVolume);
            };

            $scope.sliderOptions = {
                floor: 1,
                ceil: 10,
                hideLimitLabels: true,
                onChange: $scope.volumeUpdated
            };

            $scope.notificationOptions = soundService.notificationSoundOptions;

            $scope.selectNotification = function(n) {
                $scope.selectedNotificationSound = n;
                $scope.saveSelectedNotification();
            };

            $scope.setCustomNotiPath = function(filepath) {
                $scope.selectedNotificationSound.path = filepath;
                $scope.saveSelectedNotification();
            };

            $scope.saveSelectedNotification = function() {

                let sound = $scope.selectedNotificationSound;

                settingsService.setTaggedNotificationSound({
                    name: sound.name,
                    path: sound.name === 'Custom' ? sound.path : undefined
                });
            };

            listenerService.registerListener(
                { type: listenerService.ListenerType.CURRENT_VIEWERS_UPDATE },
                (data) => {
                    $scope.currentViewers = data.viewersCurrent;
                });

        });
}());
