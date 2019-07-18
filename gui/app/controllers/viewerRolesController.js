"use strict";
(function() {
    // This handles the Groups tab

    angular
        .module("firebotApp")
        .controller("viewerRolesController", function($scope, utilityService, viewerRolesService) {

            $scope.viewerRolesService = viewerRolesService;

            $scope.showAddOrEditCustomRoleModal = function(id) {

                let role = null;
                if (id) {
                    role = viewerRolesService.getCustomRole(id);
                }

                utilityService.showModal({
                    component: "addOrEditCustomRoleModal",
                    resolveObj: {
                        role: () => role
                    },
                    closeCallback: resp => {
                        let { action, role } = resp;

                        switch (action) {
                        case "add":
                            break;
                        case "update":
                            break;
                        case "delete":
                            break;
                        }
                    }
                });
            };


        });
}());
