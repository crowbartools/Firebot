"use strict";

const twitchRoleConstants = require("../../shared/twitch-roles");
const firebotRoleConstants = require("../../shared/firebot-roles");

(function() {

    angular
        .module("firebotApp")
        .factory("viewerRolesService", function(backendCommunicator, utilityService) {
            const service = {};

            let customRoles = {};

            let teamRoles = [];

            service.loadCustomRoles = async function() {
                // Check for legacy custom roles file and alert the user if it still exists (it shouldn't by this point)
                const hasLegacyCustomRoles = backendCommunicator.fireEventSync("check-for-legacy-custom-roles");
                if (hasLegacyCustomRoles === true) {
                    utilityService.showErrorModal("Firebot ran into an issue while migrating your custom roles to the new format. Please make sure your streamer account is logged in, then restart Firebot to try again. If you continue to receive this message, please reach out for support in our Discord.");
                    return;
                }

                const roles = await backendCommunicator.fireEventAsync("get-custom-roles");
                if (roles != null) {
                    customRoles = roles;
                }
            };
            service.loadCustomRoles();

            backendCommunicator.on("custom-roles-updated", () => {
                service.loadCustomRoles();
            });

            service.getCustomRoles = function() {
                return Object.values(customRoles);
            };

            service.getCustomRole = function(id) {
                return customRoles[id];
            };

            service.addViewerToRole = function(roleId, viewer) {
                if (!roleId || !viewer) {
                    return;
                }

                const role = service.getCustomRole(roleId);
                if (!role) {
                    return;
                }

                if (role.viewers.some(v => v.id === viewer.id)) {
                    return;
                }

                role.viewers.push(viewer);
                service.saveCustomRole(role);
            };

            service.removeViewerFromRole = function(roleId, userId) {
                if (!roleId || !userId) {
                    return;
                }

                const role = service.getCustomRole(roleId);
                if (!role) {
                    return;
                }

                if (!role.viewers.some(v => v.id === userId)) {
                    return;
                }

                role.viewers = role.viewers.filter(v => v.id !== userId);
                service.saveCustomRole(role);
            };

            service.saveCustomRole = function(role) {
                if (!role) {
                    return;
                }

                customRoles[role.id] = role;
                backendCommunicator.fireEvent("save-custom-role", role);
            };

            service.deleteCustomRole = function(roleId) {
                if (!roleId) {
                    return;
                }

                delete customRoles[roleId];
                backendCommunicator.fireEvent("delete-custom-role", roleId);
            };

            service.loadTeamRoles = async function() {
                teamRoles = await backendCommunicator.fireEventAsync("get-team-roles");
            };
            service.loadTeamRoles();

            service.getTeamRoles = function() {
                return teamRoles;
            };

            const firebotRoles = firebotRoleConstants.getFirebotRoles();
            service.getFirebotRoles = function() {
                return firebotRoles;
            };

            const twitchRoles = twitchRoleConstants.getTwitchRoles();
            service.getTwitchRoles = function() {
                return twitchRoles;
            };

            service.getAllRoles = () => [
                ...service.getTwitchRoles(),
                ...service.getTeamRoles(),
                ...service.getFirebotRoles(),
                ...service.getCustomRoles()
            ];

            service.getRoleById = (id) => {
                const customRole = customRoles[id];
                if (customRole != null) {
                    return customRole;
                }

                const teamRole = teamRoles.find(tr => tr.id === id);
                if (teamRole != null) {
                    return teamRole;
                }

                return twitchRoles.find(r => r.id === id);
            };

            service.doesRoleExist = function(id) {
                const role = service.getRoleById(id);
                return role != null;
            };

            return service;
        });
}());