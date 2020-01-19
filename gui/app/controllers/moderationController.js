"use strict";
(function() {
    //This handles the Moderation tab

    const fs = require("fs");

    angular
        .module("firebotApp")
        .controller("moderationController", function($scope, eventLogService, chatModerationService, utilityService,
            viewerRolesService) {

            $scope.activeTab = 0;

            $scope.eventLogService = eventLogService;

            $scope.pagination = {
                generalLog: {
                    currentPage: 1,
                    pageSize: 5
                },
                alertLog: {
                    currentPage: 1,
                    pageSize: 5
                }
            };

            $scope.hasCustomRoles = viewerRolesService.getCustomRoles().length > 0;
            $scope.getCustomRoles = viewerRolesService.getCustomRoles;
            $scope.getMixerRoles = viewerRolesService.getMixerRoles;

            $scope.isRoleChecked = function(role) {
                return chatModerationService.chatModerationData.settings.bannedWordList.exemptRoles.includes(role.id);
            };

            $scope.toggleRole = function(role) {
                if ($scope.isRoleChecked(role)) {
                    chatModerationService.chatModerationData.settings.bannedWordList.exemptRoles =
                        chatModerationService.chatModerationData.settings.bannedWordList.exemptRoles.filter(id => id !== role.id);
                } else {
                    chatModerationService.chatModerationData.settings.bannedWordList.exemptRoles.push(role.id);
                }
                chatModerationService.saveChatModerationSettings();
            };

            $scope.cms = chatModerationService;

            $scope.toggleBannedWordsFeature = () => {
                chatModerationService.chatModerationData.settings.bannedWordList.enabled =
                    !chatModerationService.chatModerationData.settings.bannedWordList.enabled;
                chatModerationService.saveChatModerationSettings();
            };

            $scope.showEditBannedWordsModal = () => {
                utilityService.showModal({
                    component: "editBannedWordsModal",
                    backdrop: true,
                    resolveObj: {}
                });
            };
        });
}());
