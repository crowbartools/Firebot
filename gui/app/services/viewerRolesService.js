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

            const mixerRoles = mixerRoleConstants.getMixerRoles();
            service.getMixerRoles = function() {
                return mixerRoles;
            };

            return service;
        });
}());