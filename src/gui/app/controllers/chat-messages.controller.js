"use strict";
(function() {

    angular
        .module("firebotApp")
        .controller("chatMessagesController", function(
            $scope,
            chatMessagesService,
            connectionService,
            settingsService,
            utilityService,
            activityFeedService
        ) {
            $scope.afs = activityFeedService;
            $scope.cms = chatMessagesService;
            $scope.settings = settingsService;

            $scope.disabledMessage = "";

            $scope.selectedUserData = {};

            $scope.botLoggedIn = connectionService.accounts.bot.loggedIn;

            // the number of messages to show visually, we have to make the number negative so angular knows to limit
            // from the end of the array instead of the front
            $scope.messageDisplayLimit = chatMessagesService.chatMessageDisplayLimit * -1;

            const updateLabelVisibility = (settings) => {
                const $parent = $('#dashboardActivityFeed').parent();
                $scope.hideEventLabel = () => ((parseInt(settings.dashboardActivityFeed.replace("%", "") / 100 * $parent.width())) < 180 ? true : false);
            };

            function getThreadMessages(threadOrReplyMessageId) {
                return chatMessagesService.chatQueue.filter((chatItem) => {
                    return chatItem.type === "message" && (chatItem.data.id === threadOrReplyMessageId || chatItem.data.replyParentMessageId === threadOrReplyMessageId || chatItem.data.threadParentMessageId === threadOrReplyMessageId);
                }).map(ci => ci.data);
            }

            $scope.currentThreadMessages = () => {
                if (!chatMessagesService.threadDetails?.threadParentMessageId) {
                    return [];
                }
                return getThreadMessages(chatMessagesService.threadDetails.threadParentMessageId);
            };

            $scope.updateLayoutSettings = (updatedSettings) => {
                let settings = settingsService.getDashboardLayoutSettings();

                if (settings == null) {
                    settings = {
                        dashboardViewerList: "225px",
                        dashboardChatWindow: "100%",
                        dashboardActivityFeed: "275px"
                    };

                    settingsService.setDashboardLayoutSettings(settings);
                }

                if (updatedSettings) {
                    Object.entries(updatedSettings).forEach(([key, value]) => {
                        settings[key] = value;
                    });

                    settingsService.setDashboardLayoutSettings(settings);
                }

                $scope.layout = settings;

                updateLabelVisibility(settings);
            };

            function getUpdatedChatSettings() {
                $scope.updateLayoutSettings();

                $scope.compactDisplay = settingsService.isChatCompactMode();
                $scope.alternateBackgrounds = settingsService.chatAlternateBackgrounds();
                $scope.hideDeletedMessages = settingsService.chatHideDeletedMessages();
                $scope.showAvatars = settingsService.getShowAvatars();
                $scope.showTimestamps = settingsService.getShowTimestamps();
                $scope.showBttvEmotes = settingsService.getShowBttvEmotes();
                $scope.showFfzEmotes = settingsService.getShowFfzEmotes();
                $scope.showSevenTvEmotes = settingsService.getShowSevenTvEmotes();
                $scope.showPronouns = settingsService.getShowPronouns();
                $scope.customFontSizeEnabled = settingsService.getChatCustomFontSizeEnabled();
                $scope.customFontSize = settingsService.getChatCustomFontSize();
                $scope.customFontSizeStyle = $scope.customFontSizeEnabled ?
                    `font-size: ${$scope.customFontSize}px !important;` : "";
            }
            getUpdatedChatSettings();

            function focusMessageInput() {
                angular.element("#chatMessageInput").trigger("focus");
            }

            $scope.showUserDetailsModal = (userId) => {
                if (userId == null) {
                    return;
                }

                const closeFunc = () => {};
                utilityService.showModal({
                    component: "viewerDetailsModal",
                    backdrop: true,
                    resolveObj: {
                        userId: () => userId
                    },
                    closeCallback: closeFunc,
                    dismissCallback: closeFunc
                });
            };

            $scope.showChatSettingsModal = () => {
                utilityService.showModal({
                    component: "chatSettingsModal",
                    size: "md",
                    backdrop: true,
                    dismissCallback: getUpdatedChatSettings,
                    closeCallback: getUpdatedChatSettings
                });
            };

            $scope.updateChatInput = function(text) {
                chatMessagesService.chatMessage = text;
                focusMessageInput();
            };

            $scope.setThreadDetails = (threadOrReplyMessageId) => {
                const parentReplyMessage = chatMessagesService.chatQueue.find(ci => ci.type === "message" && ci.data.id === threadOrReplyMessageId)?.data;
                if (!parentReplyMessage) {
                    return;
                }

                const threadParentId = parentReplyMessage.threadParentMessageId || parentReplyMessage.replyParentMessageId || parentReplyMessage.id;

                chatMessagesService.threadDetails = {
                    threadParentMessageId: threadParentId,
                    replyToMessageId: threadOrReplyMessageId,
                    replyToUserDisplayName: parentReplyMessage.username
                };
            };

            $scope.closeThreadPanel = () => {
                chatMessagesService.threadDetails = null;
            };

            $scope.onReplyClicked = function(threadOrReplyMessageId) {
                $scope.setThreadDetails(threadOrReplyMessageId);
            };

            $scope.chatFeedIsEnabled = function() {
                if (connectionService.connections['chat'] !== 'connected') {
                    $scope.disabledMessage = "The chat feed will enable once a connection to Chat has been made.";
                    return false;
                }
                return true;
            };

            $scope.getChatViewerListSetting = function() {
                return chatMessagesService.getChatViewerListSetting();
            };

            // This happens when a chat message is submitted.
            const chatHistory = [];
            let currrentHistoryIndex = -1;
            $scope.submitChat = function() {
                if (chatMessagesService.chatMessage == null || chatMessagesService.chatMessage.length < 1) {
                    return;
                }
                chatMessagesService.submitChat(chatMessagesService.chatSender, chatMessagesService.chatMessage, chatMessagesService.threadDetails?.replyToMessageId);
                chatHistory.unshift(chatMessagesService.chatMessage);
                currrentHistoryIndex = -1;
                chatMessagesService.chatMessage = "";
                chatMessagesService.threadDetails = null;
            };

            $scope.onMessageFieldUpdate = () => {
                currrentHistoryIndex = -1;
            };

            $scope.onMessageFieldKeypress = ($event) => {
                const keyCode = $event.which || $event.keyCode;
                if (keyCode === 38) {
                    //up arrow
                    if (
                        chatMessagesService.chatMessage.length < 1 ||
                        chatMessagesService.chatMessage === chatHistory[currrentHistoryIndex]
                    ) {
                        if (currrentHistoryIndex + 1 < chatHistory.length) {
                            currrentHistoryIndex++;
                            chatMessagesService.chatMessage = chatHistory[currrentHistoryIndex];
                        }
                    }
                } else if (keyCode === 40) {
                    //down arrow
                    if (
                        chatMessagesService.chatMessage.length > 0 ||
                        chatMessagesService.chatMessage === chatHistory[currrentHistoryIndex]
                    ) {
                        if (currrentHistoryIndex - 1 >= 0) {
                            currrentHistoryIndex--;
                            chatMessagesService.chatMessage = chatHistory[currrentHistoryIndex];
                        }
                    }
                } else if (keyCode === 13) {
                    // enter
                    $scope.submitChat();
                }
            };
        });
}());
