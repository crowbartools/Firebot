"use strict";
(function() {
    //This handles the Moderation tab

    angular
        .module("firebotApp")
        .controller("moderationController", function($scope, chatModerationService, utilityService,
            viewerRolesService, settingsService) {

            $scope.settingsService = settingsService;

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
                        if (!roleId) {
                            return;
                        }
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

            $scope.toggleUrlModerationFeature = () => {
                if (!chatModerationService.chatModerationData.settings.urlModeration.enabled) {
                    chatModerationService.chatModerationData.settings.urlModeration.enabled = true;
                    chatModerationService.registerPermitCommand();
                } else {
                    chatModerationService.chatModerationData.settings.urlModeration.enabled = false;
                    chatModerationService.unregisterPermitCommand();
                }

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
