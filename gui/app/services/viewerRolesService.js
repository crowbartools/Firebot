"use strict";

const mixerRoleConstants = require("../../shared/mixer-roles");

(function() {

    angular
        .module("firebotApp")
        .factory("viewerRolesService", function(logger, backendCommunicator) {
            let service = {};

            let customRoles = {};

            service.loadCustomRoles = async function() {
                let roles = await backendCommunicator.fireEventAsync("getCustomRoles");
                if (roles != null) {
                    customRoles = roles;
                }
            };
            service.loadCustomRoles();

            service.getCustomRoles = function() {
                return Object.values(customRoles);
            };

            service.getCustomRole = function(id) {
                return customRoles[id];
            };

            service.saveCustomRole = function(role) {
                if (!role) return;
                customRoles[role.id] = role;
                backendCommunicator.fireEvent("saveCustomRole", role);
            };

            service.deleteCustomRole = function(roleId) {
                if (!roleId) return;
                delete customRoles[roleId];
                backendCommunicator.fireEvent("deleteCustomRole", roleId);
            };

            const mixerRoles = mixerRoleConstants.getMixerRoles();
            service.getMixerRoles = function() {
                return mixerRoles;
            };

            service.getRoleById = function(id) {
                let customRole = customRoles[id];
                if (customRole != null) {
                    return customRole;
                }

                return mixerRoles.find(r => r.id === id);
            };

            return service;
        });
}());