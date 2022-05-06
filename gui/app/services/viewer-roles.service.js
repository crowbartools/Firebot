"use strict";

const twitchRoleConstants = require("../../shared/twitch-roles");
const firebotRoleConstants = require("../../shared/firebot-roles");

(function() {

    angular
        .module("firebotApp")
        .factory("viewerRolesService", function(backendCommunicator) {
            const service = {};

            let customRoles = {};

            let teamRoles = [];

            service.loadCustomRoles = async function() {
                const roles = await backendCommunicator.fireEventAsync("getCustomRoles");
                if (roles != null) {
                    customRoles = roles;
                }
            };
            service.loadCustomRoles();

            backendCommunicator.on("custom-role-update", () => {
                service.loadCustomRoles();
            });

            service.getCustomRoles = function() {
                return Object.values(customRoles);
            };

            service.getCustomRole = function(id) {
                return customRoles[id];
            };

            service.addUserToRole = function(roleId, username) {
                if (!roleId || !username) {
                    return;
                }

                const role = service.getCustomRole(roleId);
                if (!role) {
                    return;
                }

                if (role.viewers.some(v => v.toLowerCase() === username.toLowerCase())) {
                    return;
                }

                role.viewers.push(username);
                service.saveCustomRole(role);
            };

            service.removeUserFromRole = function(roleId, username) {
                if (!roleId || !username) {
                    return;
                }

                const role = service.getCustomRole(roleId);
                if (!role) {
                    return;
                }

                if (!role.viewers.some(v => v.toLowerCase() === username.toLowerCase())) {
                    return;
                }

                role.viewers = role.viewers.filter(v => v.toLowerCase() !== username.toLowerCase());
                service.saveCustomRole(role);
            };

            service.saveCustomRole = function(role) {
                if (!role) {
                    return;
                }

                customRoles[role.id] = role;
                backendCommunicator.fireEvent("saveCustomRole", role);
            };

            service.deleteCustomRole = function(roleId) {
                if (!roleId) {
                    return;
                }

                delete customRoles[roleId];
                backendCommunicator.fireEvent("deleteCustomRole", roleId);
            };

            service.loadTeamRoles = async function() {
                teamRoles = await backendCommunicator.fireEventAsync("getTeamRoles");
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