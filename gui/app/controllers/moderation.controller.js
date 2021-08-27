"use strict";
(function() {
    //This handles the Moderation tab

    angular
        .module("firebotApp")
        .controller("moderationController", function($scope, chatModerationService, utilityService,
            viewerRolesService, settingsService) {

            $scope.settingsService = settingsService;

            $scope.getExemptRoles = (toolScope) => {
                const roles = [
                    ...viewerRolesService.getTwitchRoles(),
                    ...viewerRolesService.getCustomRoles(),
                    ...viewerRolesService.getTeamRoles()
                ];

                switch (toolScope) {
                case 'global':
                    return roles.filter(r => chatModerationService.chatModerationData.settings.exemptRoles.includes(r.id));
                case 'bannedWordList':
                    return roles.filter(r => chatModerationService.chatModerationData.settings.bannedWordList.exemptRoles.includes(r.id));
                case 'emoteLimit':
                    return roles.filter(r => chatModerationService.chatModerationData.settings.emoteLimit.exemptRoles.includes(r.id));
                case 'urlModeration':
                    return roles.filter(r => chatModerationService.chatModerationData.settings.urlModeration.exemptRoles.includes(r.id));
                default:
                    return roles.filter(r => chatModerationService.chatModerationData.settings.exemptRoles.includes(r.id));
                }
            };

            $scope.openAddExemptRoleModal = (toolScope) => {
                let options = [];
                const roles =
                    [
                        ...viewerRolesService.getTwitchRoles(),
                        ...viewerRolesService.getCustomRoles(),
                        ...viewerRolesService.getTeamRoles()
                    ];

                switch (toolScope) {
                case 'global':
                    options = roles.filter(r => !chatModerationService.chatModerationData.settings.exemptRoles.includes(r.id));
                    break;
                case 'bannedWordList':
                    options = roles.filter(r => !chatModerationService.chatModerationData.settings.bannedWordList.exemptRoles.includes(r.id));
                    break;
                case 'emoteLimit':
                    options = roles.filter(r => !chatModerationService.chatModerationData.settings.emoteLimit.exemptRoles.includes(r.id));
                    break;
                case 'urlModeration':
                    options = roles.filter(r => !chatModerationService.chatModerationData.settings.urlModeration.exemptRoles.includes(r.id));
                    break;
                default:
                    options = roles.filter(r => !chatModerationService.chatModerationData.settings.exemptRoles.includes(r.id));
                }

                utilityService.openSelectModal(
                    {
                        label: "Add Exempt Role",
                        options: options.map(r => ({
                            id: r.id,
                            name: r.name
                        })),
                        saveText: "Add",
                        validationText: "Please select a role."

                    },
                    (roleId) => {
                        if (!roleId) return;

                        switch (toolScope) {
                        case 'global':
                            chatModerationService.chatModerationData.settings.exemptRoles.push(roleId);
                            break;
                        case 'bannedWordList':
                            chatModerationService.chatModerationData.settings.bannedWordList.exemptRoles.push(roleId);
                            break;
                        case 'emoteLimit':
                            chatModerationService.chatModerationData.settings.emoteLimit.exemptRoles.push(roleId);
                            break;
                        case 'urlModeration':
                            chatModerationService.chatModerationData.settings.urlModeration.exemptRoles.push(roleId);
                            break;
                        default:
                            chatModerationService.chatModerationData.settings.exemptRoles.push(roleId);
                        }

                        chatModerationService.saveChatModerationSettings();
                    });
            };

            $scope.removeExemptRole = (toolScope, roleId) => {
                switch (toolScope) {
                case 'global':
                    chatModerationService.chatModerationData.settings.exemptRoles =
                        chatModerationService.chatModerationData.settings.exemptRoles.filter(id => id !== roleId);
                    break;
                case 'bannedWordList':
                    chatModerationService.chatModerationData.settings.bannedWordList.exemptRoles =
                        chatModerationService.chatModerationData.settings.bannedWordList.exemptRoles.filter(id => id !== roleId);
                    break;
                case 'emoteLimit':
                    chatModerationService.chatModerationData.settings.emoteLimit.exemptRoles =
                        chatModerationService.chatModerationData.settings.emoteLimit.exemptRoles.filter(id => id !== roleId);
                    break;
                case 'urlModeration':
                    chatModerationService.chatModerationData.settings.urlModeration.exemptRoles =
                        chatModerationService.chatModerationData.settings.urlModeration.exemptRoles.filter(id => id !== roleId);
                    break;
                default:
                    chatModerationService.chatModerationData.settings.exemptRoles =
                    chatModerationService.chatModerationData.settings.exemptRoles.filter(id => id !== roleId);
                }

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
