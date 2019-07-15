"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("customRolesService", function(logger, backendCommunicator) {
            let service = {};

            let customRoles = {};

            service.loadCustomRoles = async function() {
                let roles = await backendCommunicator.fireEventAsync("getCustomRoles");
                if (roles != null) {
                    customRoles = roles;
                }
            };

            service.getCustomRoles = function() {
                return Object.values(customRoles);
            };


        });
}());