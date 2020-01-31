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

            $scope.getExemptRoles = () => {
                let allRoles = viewerRolesService.getMixerRoles().concat(viewerRolesService.getCustomRoles());

                return allRoles.filter(r => chatModerationService.chatModerationData.settings.bannedWordList.exemptRoles.includes(r.id));
            };

            $scope.openAddExemptRoleModal = () => {
                let allRoles = viewerRolesService.getMixerRoles().concat(viewerRolesService.getCustomRoles());

                let options = allRoles
                    .filter(r =>
                        !chatModerationService.chatModerationData.settings.bannedWordList.exemptRoles.includes(r.id))
                    .map(r => {
                        return {
                            id: r.id,
                            name: r.name
                        };
                    });
                utilityService.openSelectModal(
                    {
                        label: "Add Exempt Role",
                        options: options,
                        saveText: "Add",
                        validationText: "Please select a role."

                    },
                    (roleId) => {
                        if (!roleId) return;
                        chatModerationService.chatModerationData.settings.bannedWordList.exemptRoles.push(roleId);
                        chatModerationService.saveChatModerationSettings();
                    });
            };

            $scope.removeExemptRole = (roleId) => {
                chatModerationService.chatModerationData.settings.bannedWordList.exemptRoles =
                        chatModerationService.chatModerationData.settings.bannedWordList.exemptRoles.filter(id => id !== roleId);
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
