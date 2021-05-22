"use strict";
(function() {
    //This handles the Moderation tab

    const fs = require("fs");

    angular
        .module("firebotApp")
        .controller("moderationController", function($scope, eventLogService, chatModerationService, utilityService,
            viewerRolesService, settingsService) {

            $scope.activeTab = 0;

            $scope.eventLogService = eventLogService;

            $scope.settingsService = settingsService;

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
                return [
                    ...viewerRolesService.getTwitchRoles(),
                    ...viewerRolesService.getCustomRoles(),
                    ...viewerRolesService.getTeamRoles()
                ].filter(r => chatModerationService.chatModerationData.settings.exemptRoles.includes(r.id));
            };

            $scope.openAddExemptRoleModal = () => {

                const options =
                    [
                        ...viewerRolesService.getTwitchRoles(),
                        ...viewerRolesService.getCustomRoles(),
                        ...viewerRolesService.getTeamRoles()
                    ]
                        .filter(r =>
                            !chatModerationService.chatModerationData.settings.exemptRoles.includes(r.id))
                        .map(r => ({
                            id: r.id,
                            name: r.name
                        }));
                utilityService.openSelectModal(
                    {
                        label: "Add Exempt Role",
                        options: options,
                        saveText: "Add",
                        validationText: "Please select a role."

                    },
                    (roleId) => {
                        if (!roleId) return;
                        chatModerationService.chatModerationData.settings.exemptRoles.push(roleId);
                        chatModerationService.saveChatModerationSettings();
                    });
            };

            $scope.removeExemptRole = (roleId) => {
                chatModerationService.chatModerationData.settings.exemptRoles =
                        chatModerationService.chatModerationData.settings.exemptRoles.filter(id => id !== roleId);
                chatModerationService.saveChatModerationSettings();
            };

            $scope.cms = chatModerationService;

            $scope.showEditBannedWordsModal = () => {
                utilityService.showModal({
                    component: "editBannedWordsModal",
                    backdrop: true,
                    resolveObj: {}
                });
            };
        });
}());
