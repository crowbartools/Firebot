"use strict";

const twitchRoleConstants = require("../../shared/twitch-roles");
const firebotRoleConstants = require("../../shared/firebot-roles");

(function() {

    angular
        .module("firebotApp")
        .factory("viewerRolesService", function(backendCommunicator, utilityService, accountAccess) {
            const service = {};

            let customRoles = {};
            let teamRoles = [];

            backendCommunicator.onAsync("custom-roles:custom-roles-updated", async (customRoleData) => {
                if (customRoleData?.hasLegacyCustomRoles === true) {
                    utilityService.showErrorModal("Firebot ran into an issue while migrating your custom roles to the new format. Please make sure your streamer account is logged in, then restart Firebot to try again. If you continue to receive this message, please reach out for support in our Discord.");
                    return;
                }

                customRoles = customRoleData?.roles ?? {};
            });

            backendCommunicator.onAsync("team-roles:team-roles-updated", async (roles) => {
                teamRoles = roles ?? [];
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
                backendCommunicator.send("save-custom-role", role);
            };

            service.deleteCustomRole = function(roleId) {
                if (!roleId) {
                    return;
                }

                delete customRoles[roleId];
                backendCommunicator.send("delete-custom-role", roleId);
            };

            service.getTeamRoles = function() {
                return teamRoles;
            };

            const firebotRoles = firebotRoleConstants.getFirebotRoles();
            service.getFirebotRoles = function() {
                return firebotRoles;
            };

            const twitchRoles = twitchRoleConstants.getTwitchRoles();
            service.getViewersForTwitchRole = (id) => {
                switch (id) {
                    case "broadcaster":
                        return [accountAccess.accounts.streamer];
                    case "mod":
                        return backendCommunicator.fireEventSync("twitch-roles:get-moderators");
                    case "vip":
                        return backendCommunicator.fireEventSync("twitch-roles:get-vips");
                    case "sub":
                        return backendCommunicator.fireEventSync("twitch-roles:get-subscribers");
                    case "tier1":
                        return backendCommunicator.fireEventSync("twitch-roles:get-subscribers").filter(s => s.subTier === "tier1");
                    case "tier2":
                        return backendCommunicator.fireEventSync("twitch-roles:get-subscribers").filter(s => s.subTier === "tier2");
                    case "tier3":
                        return backendCommunicator.fireEventSync("twitch-roles:get-subscribers").filter(s => s.subTier === "tier3");
                    case "viewerlistbot":
                        return backendCommunicator.fireEventSync("chat-roles:get-known-bots");
                    default:
                        return [];
                }
            };

            service.updateModRoleForUser = (username, shouldBeMod) => {
                backendCommunicator.send("update-user-mod-status", { username, shouldBeMod });
            };

            service.updateVipRoleForUser = (username, shouldBeVip) => {
                backendCommunicator.send("update-user-vip-status", { username, shouldBeVip });
            };

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

            backendCommunicator.send("custom-roles:ui-service-ready");
            backendCommunicator.send("team-roles:ui-service-ready");

            return service;
        });
}());